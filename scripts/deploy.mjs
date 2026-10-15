import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { deploymentCommands, targets } from './lib/hosting.mjs';

const country = process.argv[2];
const target = targets[country];
if (!target) throw new Error('Usage: node scripts/deploy.mjs bw|zw [--execute]');
const execute = process.argv.includes('--execute');
const commands = deploymentCommands(`dist/${country}`, country, process.env.AWS_REGION || 'af-south-1');
const manifest = JSON.parse(readFileSync(`dist/${country}/.hosting/manifest.json`, 'utf8'));
if (process.env.GITHUB_SHA && manifest.revision !== process.env.GITHUB_SHA) throw new Error('Artifact does not match this commit');
if (!execute) {
  console.log(JSON.stringify({ country, target, commands }, null, 2));
} else {
  const awsJson = args => JSON.parse(execFileSync('aws', [...args, '--output', 'json'], { encoding: 'utf8' }));
  // Read-only preflight catches accidental distribution/bucket mismatches before upload.
  const { DistributionConfig: config } = awsJson(['cloudfront', 'get-distribution-config', '--id', target.distribution]);
  if (!config.Aliases.Items.includes(new URL(target.origin).hostname) ||
      !config.Origins.Items.some(origin => origin.DomainName.startsWith(`${target.bucket}.s3`) && !origin.OriginPath && origin.Id === config.DefaultCacheBehavior.TargetOriginId)) {
    throw new Error('CloudFront does not point to the expected site bucket');
  }
  execFileSync('aws', ['s3api', 'head-bucket', '--bucket', target.bucket], { stdio: 'inherit' });
  for (const args of commands) execFileSync('aws', args, { stdio: 'inherit' });
  const result = awsJson(['cloudfront', 'create-invalidation', '--distribution-id', target.distribution, '--paths', '/*']);
  execFileSync('aws', ['cloudfront', 'wait', 'invalidation-completed', '--distribution-id', target.distribution, '--id', result.Invalidation.Id], { stdio: 'inherit' });
  console.log(`Deployed ${country}; CloudFront invalidation completed.`);
}
