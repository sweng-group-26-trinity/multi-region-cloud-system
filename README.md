# DineHub

> See our documentation website [here](https://staging.main.multi-region-cloud-system.sweng-group-26-trinity.garnix.me/docs).

DineHub is a multi region cloud native restaurant ordering system with resilient fallback mechanisms and detailed sustainability goals.

## 1. Build and Run

### Clone the Repository

Set your terminal's working to your workspace directory and run:

```bash
git clone https://gitlab.scss.tcd.ie/sweng-group-26/multi-region-cloud-system
cd multi-region-cloud-system
```

### Nix

We use [Nix](https://nixos.org/) as our build system as it allows us a bunch of nice benefits over docker:

- Native executable binaries that are still completely reproducible between systems
- Easy [development environments](https://nixos-and-flakes.thiscute.world/development/intro)
- Docker Compose alternatives without container nonsense
- Universal formatters

The fastest way to get nix on macOS/linux is from [here](https://github.com/DeterminateSystems/nix-installer) by running:

```
curl -fsSL https://install.determinate.systems/nix | sh -s -- install --determinate
```

Windows users can use [NixOS-WSL](https://github.com/nix-community/NixOS-WSL) or run [this docker image](https://hub.docker.com/r/nixpkgs/nix-flakes).

If you are on coder a script has been included to make it easier to use nix - just run `./scripts/setup-coder.sh` and wait.

### Development Environment

Enter the development environment by running:

> You can automate this with [direnv](https://direnv.net/).

```
nix develop
```

This will put you into a new subshell with all of the exact system dependencies needed for developing the project (java, gradle, bun, etc) ready to use straight away.

### Compose

This repository has [process-compose](https://community.flake.parts/process-compose-flake) setup, which will launch:

- A hot reloading server for frontend development through [bun](https://bun.com/)'s bundler.
- A hot reloading server for backend development via [spring boot dev-tools](https://docs.spring.io/spring-boot/reference/using/devtools.html).
- A preconfigured database server for postgres.

Launch process compose with:

```
nix run .#compose
```

### Running the Tests

You may test the project by running:

```
nix flake check -L
```

This single command will (in parallel, and probably not in this exact order):

- Run frontend tests
- Create a release minified build for the frontend
- Run backend tests
- Create a release build for the backend
- Run extra vm tests with the compiled backend as a [systemd](https://systemd.io/) unit
- Check that the repository is formatted properly

Our CI is designed to be as annoying as possible in order to encourage us to create the best outcomes. As a result any linter failures or missing docs will could as an error.

## 7. Other Notes on Project

### Documentation

We have automatic generation of code documentation in this repository via [Javadoc](https://docs.oracle.com/javase/8/docs/technotes/tools/windows/javadoc.html) and [Typedoc](https://typedoc.org/).

> There is a production version of our docs online [here](https://staging.main.multi-region-cloud-system.sweng-group-26-trinity.garnix.me/).

View it in your browser with:

```
nix run .#docs.serve
```

### Locking

Both the frontend and backend depend on a collection of hashes produced by [bun2nix](https://github.com/nix-community/bun2nix) and [gradle2nix](https://github.com/tadfisher/gradle2nix), respectively.

If you add a new package and encounted some missing dependency issues, try running either `bun2nix -o bun.nix` in the frontend or `gradle2nix` in the backend.

### Frontend Information

The frontend is currently built with [bun](https://bun.com/), a drop-in replacement to [node-js](https://nodejs.org/), which is an order of magnitude faster for a lot of common operations.

It also includes a [built-in testing framework](https://bun.com/docs/test) and [webpack like bundler](https://bun.com/docs/bundler), both of which we use for developing the frontend.

We chose [React](https://react.dev/) as our frontend framework of choice.

### Backend Information

The backend is a typical [spring boot project](https://spring.io/).

We use [Gradle](https://gradle.org/) as our build system as it is much faster than maven and has better lock-file capabilities making CI/CD reproducible builds less of a headache.

### Before pushing

Before you push your code run ` nix fmt` which will format your code remove whitespaces and will unify code formatting across the entire repository, regardless of language.

Run `nix flake check -L` which will run all the tests in the repository.
