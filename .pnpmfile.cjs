function readPackageHook(pkg) {
  // Allow all build scripts by default
  return pkg
}

module.exports = {
  hooks: {
    readPackage: readPackageHook,
  },
}
