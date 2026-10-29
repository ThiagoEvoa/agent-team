# Dart code generation

Use only when introducing, changing, or running an adopted Dart/Flutter generator.

Use Freezed/JSON generation, Retrofit, or other generators only when adopted or justified by actual requirements; verify generator/runtime compatibility. Prefer existing build scripts; run build_runner only for the packages/workspace supported by the installed version and configuration. Review generated diffs and never silently discard conflicting user files.
