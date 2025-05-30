// bin/monitoring-app.ts

import * as cdk from 'aws-cdk-lib';
import { DiskMonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();

// Deploy to primary account
new DiskMonitoringStack(app, 'DiskMonitoring-Primary', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Deploy to secondary accounts
const secondaryAccounts = ['111111111111', '222222222222', '333333333333']; // Replace with actual account IDs

secondaryAccounts.forEach((account) => {
  new DiskMonitoringStack(app, `DiskMonitoring-${account}`, {
    env: {
      account: account,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
});