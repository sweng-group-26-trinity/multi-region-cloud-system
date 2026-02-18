# Disk layout for GCP VMs (used by nixos-anywhere to partition on first deploy)
# All nodes use the same layout: GPT, BIOS boot + ext4 root on /dev/sda
_: {
  flake.nixosModules.diskConfig = {
    disko.devices.disk.main = {
      device = "/dev/sda";
      type = "disk";
      content = {
        type = "gpt";
        partitions = {
          # 1 MB BIOS boot partition — required for GRUB on GPT disks
          boot = {
            size = "1M";
            type = "EF02";
          };
          # Rest of disk as ext4 root
          root = {
            size = "100%";
            content = {
              type = "filesystem";
              format = "ext4";
              mountpoint = "/";
            };
          };
        };
      };
    };
  };
}
