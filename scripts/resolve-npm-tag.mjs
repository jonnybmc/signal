import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function resolveNpmTag(version, releaseTag, prerelease) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/.test(version)) {
    throw new Error('Invalid package release version');
  }
  if (releaseTag !== `v${version}`) throw new Error('Release tag must match the SDK version');
  const isPrerelease = version.includes('-');
  if (prerelease !== undefined && prerelease !== '' && prerelease !== String(isPrerelease)) {
    throw new Error('Release prerelease flag disagrees with SDK version');
  }
  return isPrerelease ? 'next' : 'latest';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pkg = JSON.parse(readFileSync(new URL('../packages/signal/package.json', import.meta.url), 'utf8'));
  const tag = resolveNpmTag(pkg.version, process.env.RELEASE_TAG, process.env.RELEASE_PRERELEASE);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `tag=${tag}\n`);
  else console.log(tag);
}
