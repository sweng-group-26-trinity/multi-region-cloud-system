# Disk layout for GCP VMs (used by nixos-anywhere to partition on first deploy)
# All nodes use the same layout: GPT, BIOS boot + btrfs root on /dev/sda
_: {
  flake.nixosModules.diskConfig =
    {
      lib,
      ...
    }:
    {
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
            # Rest of disk as btrfs root (reflink-aware — saves space with Nix store deduplication)
            root = {
              size = "100%";
              content = {
                type = "filesystem";
                format = "btrfs";
                mountpoint = "/";
              };
            };
          };
        };
      };

      fileSystems."/".fsType = lib.mkForce "btrfs";
      fileSystems."/".device = lib.mkForce "/dev/disk/by-partlabel/disk-main-root";
      boot.loader.grub.devices = lib.mkForce [ "/dev/sda" ];
    };
}
