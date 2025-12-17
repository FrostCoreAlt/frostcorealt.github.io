This guide makes a lightweight linux system using:
- Linux 6.6 LTS
- musl 1.2.5
- Busybox 1.37
### Preparation
```bash
mkdir -p ~/chroot
cd ~/chroot
mkdir -p {bin,boot,dev,etc,lib,lib64,proc,sys,tmp,usr,var,mnt}
export CHRT=$(pwd)
cd ~
```
This makes a chroot folder where we will setup everything, and also makes the base directories for our environment
#### Compiling the kernel
Grab a kernel tarball, here I use 6.6.119 as it is the latest as of writing
```bash
wget https://kernel.org/pub/linux/kernel/v6.x/linux-6.6.119.tar.xz
tar xf linux-6.6.119.tar.xz
```
After extracting, go in the directory and initialize the default config, which doesn't take long to build
```bash
cd linux-6.6.119
make defconfig
```
Now we compile the kernel with all cores+threads
`make -j$(nproc)`
After this, we install all the modules and put the kernel in our chroot:
```bash
sudo make modules_install INSTALL_MOD_PATH=$CHRT
sudo cp -v arch/x86_64/boot/bzImage $CHRT/boot/vmlinuz
```
### Compiling musl
musl is an alternative to the GNU C Library that is lightweight and compatible with most standards.
Grab the latest musl source as of writing:
```bash
wget https://musl.libc.org/releases/musl-1.2.5.tar.gz
tar xvf musl-1.2.5.tar.gz
cd musl-1.2.5
```
Configure to compile, pointing at our chroot, and compile:
```bash
./configure --prefix=$CHRT --disable-shared
make -j$(nproc)
make install
```
### Compiling BusyBox
BusyBox is a reimplementation of UNIX core utilities.
Grab latest BusyBox as of writing:
```bash
wget https://busybox.net/downloads/busybox-1.37.0.tar.bz2
tar xjf busybox-1.37.0.tar.bz2
cd busybox-1.37.0
```
Initialize default config:
`make defconfig`
Enable static build and disable TC (CBQ is gone in new kernels)
```bash
sed -i 's/.*CONFIG_STATIC.*/CONFIG_STATIC=y/' .config
sed -i 's/^CONFIG_TC=y/CONFIG_TC=n/' .config
```
Make and install:
```bash
make -j$(nproc)
make CONFIG_PREFIX=$CHRT install
```
Set root uid:
`sudo chown root:root $CHRT/bin/busybox`
Set BusyBox as init system:
```bash
cd $CHRT
ln -s bin/busybox init
```
### Setting up our environment
Make console and null, the system uses these extensively:
```bash
cd $CHRT/dev
sudo mknod console c 5 1
sudo mknod null c 1 3
```
Write a minimal inittab:
```bash
cat >> etc/inittab << EOF
::sysinit:/etc/init.d/rcS
::askfirst:/bin/sh
::ctrlaltdel:/bin/umount -a -r
::shutdown:/bin/umount -a -r
EOF
```
Create a init script to initialize proc and sysfs
```bash
mkdir -p $CHRT/etc/init.d
cat > $CHRT/etc/init.d/rcS << "EOF"
#!/bin/sh
mount -t proc proc /proc
mount -t sysfs sysfs /sys
mdev -s

ln -sf /proc/mounts /etc/mtab
EOF
```
Make it executable:
`chmod +x $CHRT/etc/init.d/rcS`
Generate initramfs (this is what we will be booting off of:)
`find . -print0 | cpio --null -ov --format=newc | gzip -9 > $CHRT/boot/initramfs.cpio.gz`
### Setting up GRUB and making an ISO:
Make our ISO directory and put kernel and initramfs in it:
```bash
mkdir -pv iso/boot/grub
cp boot/* iso/boot/
```
Write grub.cfg
```bash
cat > iso/boot/grub/grub.cfg <<'EOF'
set timeout=5
set default=0

menuentry "Linux" {
    linux /boot/vmlinuz root=/dev/ram0 rw
    initrd /boot/initramfs.cpio.gz
}
EOF
```
Make an ISO:
`grub-mkrescue -o ~/linux.iso iso`
## Testing the ISO
Use QEMU to test the ISO:
`qemu-system-x86_64 -cdrom ~/linux.iso -m 1024M`
# Notes
This is a very minimal environment, it runs under initramfs, so it doesnt have access to most devices.

I will in the future make a guide where we setup an actual, bootable rootfs with ext4
