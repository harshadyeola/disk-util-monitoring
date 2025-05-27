# Multi-Account AWS Disk Utilization Monitoring

## Overview

This project provides a scalable solution for monitoring disk utilization across multiple AWS accounts using Ansible, AWS Systems Manager, and CloudWatch. It's designed to address the needs of enterprises managing multiple AWS accounts, particularly those that have grown through acquisitions.

## Features

- Centralized management of multiple AWS accounts
- Automated disk utilization monitoring across all EC2 instances
- Scalable architecture to accommodate future account additions
- Integration with existing Ansible configuration management
- Real-time alerting for critical disk usage thresholds
## Architecture

The solution uses the following AWS services:

- AWS Organizations: For centralized management of multiple AWS accounts
- AWS Systems Manager: To execute Ansible playbooks across EC2 instances
- AWS CloudWatch: For metrics storage, visualization, and alerting
- Ansible: For collecting disk utilization metrics
## Prerequisites

- AWS CLI installed and configured
- Ansible installed
- Proper IAM permissions to create and manage resources across accounts
## Setup

1. Set up AWS Organizations
2. Configure cross-account access
3. Deploy Systems Manager configuration
4. Create and upload Ansible playbook
5. Configure CloudWatch dashboards and alarms

## Usage

1. The Ansible playbook is automatically executed on a schedule via Systems Manager.
2. Disk utilization metrics are collected and sent to CloudWatch.
3. CloudWatch Dashboards provide a centralized view of disk utilization across all accounts.
4. Alerts are triggered when disk usage exceeds defined thresholds.

## Files

- `disk_usage.yml`: Ansible playbook for collecting disk usage metrics
- `ssm_document.json`: Systems Manager Automation document for running the Ansible playbook
- `iam_policy.json`: IAM policy for cross-account access
## Scaling

The solution is designed to scale as new AWS accounts are added:

1. Add new accounts to AWS Organizations
2. Apply the standardized IAM policies and roles
3. Include new instances in Systems Manager inventory
4. Update CloudWatch Dashboards to include new accounts

## Maintenance

- Regularly update the Ansible playbook as needed
- Review and adjust CloudWatch alarms and thresholds
- Perform periodic security reviews of IAM policies and roles
## Troubleshooting

- Check Systems Manager execution history for playbook run status
- Review CloudWatch Logs for detailed execution logs
- Verify IAM permissions if cross-account access issues occur
## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.