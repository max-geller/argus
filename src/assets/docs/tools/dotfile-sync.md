# Dotfile Sync Workflow

## Push Changes
```
cd ~/.config
./scripts/sync-dotfiles.sh push
```

## Pull Updates
```
./scripts/sync-dotfiles.sh pull
```

## Backup Strategy
- Weekly tarball of entire `~/.config`
- Store in `/mnt/backups/dotfiles`
