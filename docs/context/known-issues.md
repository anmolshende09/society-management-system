# Known Issues & Environmental Quirks

1. **Docker Desktop on Windows**:
   - `docker` CLI is not currently running or available in the default host PATH. Local container services can run via Docker Desktop or WSL2 when installed/started.
2. **Node.js Host Version**:
   - Machine has Node.js `v22.12.0`. Production container image is pinned to `Node.js 24 LTS`. `.npmrc` is set with `engine-strict=false` to permit local development smoothly.
3. **Corepack Privileges on Windows**:
   - `corepack enable` fails without administrator rights due to symlink creation in `C:\Program Files\nodejs`. `pnpm` is installed globally in `%APPDATA%\npm` at `v10.5.2`.
