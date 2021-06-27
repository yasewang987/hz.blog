# Git问题汇总

`error: copy-fd: write returned Permission denied`
`fatal: cannot copy '/usr/share/git-core/templates/description' to '/mnt/wk01/xxx/.git/description': Permission denied`

```bash
sudo chmod -R 755 /usr/share/git-core/templates/description
```