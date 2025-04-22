# @pbinj/pbj

## 4.0.1

### Patch Changes

- eb27007: a little type cleanup
  - @pbinj/pbj-guards@4.0.1

## 4.0.0

### Major Changes

- 0fe7344: Changed the api to expose less of the guts and make future features easier. Added the ability to use PBinJKeyTypes as place holders during registration.

### Patch Changes

- 84e61c7: Added builder to make intitializing easier
  - @pbinj/pbj-guards@4.0.0

## 4.0.0-next.0

### Major Changes

- 0fe7344: Changed the api to expose less of the guts and make future features easier. Added the ability to use PBinJKeyTypes as place holders during registration.

### Patch Changes

- 474837b: Added builder to make intitializing easier
  - @pbinj/pbj-guards@4.0.0-next.0

## 3.0.3

### Patch Changes

- 70e0610: Fix packaging nerd
- 70e0610: Fix module esm/cjs madness
- Updated dependencies [70e0610]
- Updated dependencies [70e0610]
  - @pbinj/pbj-guards@3.0.3

## 3.0.2

### Patch Changes

- 3eb0a30: Added intializable lifecycle to allow construction of objects out of order.
- 3eb0a30: Added init support and better dependency intialization order
- 866083c: Moved guards logic to its own module
- Updated dependencies [866083c]
  - @pbinj/pbj-guards@3.0.2

## 3.0.1

### Patch Changes

- 74627ee: Added browser compatibility support. The package now includes browser-specific builds and configurations to ensure it works properly in browser environments, ESM, and CJS module systems.
- 74627ee: Fixed CLI script for pbj-visualization to ensure it works properly during installation. Added a CLI script wrapper in the package root, updated the server CLI script, and fixed package.json configuration. Also updated symbols in the core package for better compatibility.
- c144b5b: small bug fix in handling null values
- 74627ee: Added browser support and various packaging fixes
- Updated dependencies [74627ee]
  - @pbinj/pbj-guards@3.0.1

## 3.0.0

### Minor Changes

- 607ecc8: Moved guards logic to its own module

### Patch Changes

- Updated dependencies [607ecc8]
  - @pbinj/pbj-guards@3.0.0

## 2.0.0

### Minor Changes

- 82b9175: Added docs and fixed some packaging issues, also wrote a checker for the examples

## 1.0.2

### Patch Changes

- 91495a7: Added logging and visualization to make debugging and development easier.

## 1.0.1

### Patch Changes

- 5987271: Adds async support and renames the existing async thing to scope for better accuracy

## 1.0.0

### Minor Changes

- c9efd95: Changed the onServicesAdd api so that it is more obvious and easier to use

### Patch Changes

- cb5246a: Added visualization and commonjs packaging

## 0.4.3

### Patch Changes

- 93c119c: renamed packages keeping them at the same version

## 0.4.2

### Patch Changes

- 8e3f995: putting these at the same version

## 0.4.1

### Patch Changes

- 142165f: Renamed to PBinJ

## 0.4.0

### Minor Changes

- cb003b5: Added metrics and a long list of other improvements
