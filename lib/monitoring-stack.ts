// lib/monitoring-stack.ts

import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import path from 'path';

export class DiskMonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket for Ansible playbooks
    const playbookBucket = new s3.Bucket(this, 'AnsiblePlaybookBucket', {
        bucketName: `ansible-playbooks-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        versioned: true,
    });
  
    // Deploy Ansible playbook to S3
    new s3deploy.BucketDeployment(this, 'DeployPlaybook', {
    sources: [s3deploy.Source.asset(path.join(__dirname, '../ansible'))],
    destinationBucket: playbookBucket,
    retainOnDelete: true, // Keep files in bucket when stack is destroyed
    });

    // Create SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'DiskAlertTopic', {
      topicName: 'disk-utilization-alerts',
      displayName: 'Disk Utilization Alerts',
    });

    // Create IAM Role for Systems Manager
    const ssmRole = new iam.Role(this, 'SSMExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ssm.amazonaws.com'),
      roleName: 'DiskMonitoring-SSMExecutionRole',
    });

    // Add required policies to SSM Role
    ssmRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudwatch:PutMetricData',
        's3:GetObject',
        's3:ListBucket',
        'sns:Publish',
      ],
      resources: [
        playbookBucket.bucketArn,
        `${playbookBucket.bucketArn}/*`,
        alertTopic.topicArn,
      ],
    }));

    // Create Systems Manager Automation Document
    const automationDoc = new ssm.CfnDocument(this, 'DiskMonitoringAutomation', {
      name: 'DiskUtilization-Monitoring',
      documentType: 'Automation',
      content: {
        schemaVersion: '0.3',
        description: 'Automation document to run Ansible playbook for disk monitoring',
        parameters: {
          InstanceIds: {
            type: 'StringList',
            description: 'List of target EC2 instances',
          },
        },
        mainSteps: [{
          name: 'runAnsiblePlaybook',
          action: 'AWS-RunAnsiblePlaybook',
          inputs: {
            sourceType: 'S3',
            sourceInfo: JSON.stringify({
              path: `https://${playbookBucket.bucketName}.s3.amazonaws.com/disk_usage.yml`,
            }),
            instanceIds: '{{ InstanceIds }}',
          },
        }],
      },
    });

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'DiskUtilizationDashboard', {
      dashboardName: 'disk-utilization-dashboard',
    });

    // Create CloudWatch Metric and Alarm
    const diskMetric = new cloudwatch.Metric({
      namespace: 'DiskUtilization',
      metricName: 'DiskUsagePercent',
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const diskAlarm = new cloudwatch.Alarm(this, 'HighDiskUsageAlarm', {
      metric: diskMetric,
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'Disk usage is above 80%',
      alarmName: 'HighDiskUsage',
    });

    diskAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // Cross-Account Role (to be assumed by primary account)
    const crossAccountRole = new iam.Role(this, 'CrossAccountMonitoringRole', {
      assumedBy: new iam.AccountPrincipal(props?.env?.account || ''),
      roleName: 'DiskMonitoring-CrossAccountRole',
    });

    crossAccountRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:StartAutomationExecution',
        'cloudwatch:GetMetricData',
        'cloudwatch:PutMetricData',
      ],
      resources: ['*'],
    }));

    // Outputs
    new cdk.CfnOutput(this, 'PlaybookBucketName', {
      value: playbookBucket.bucketName,
      description: 'Name of the S3 bucket containing Ansible playbooks',
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'ARN of the SNS topic for alerts',
    });

    new cdk.CfnOutput(this, 'CrossAccountRoleArn', {
      value: crossAccountRole.roleArn,
      description: 'ARN of the cross-account IAM role',
    });
  }
}