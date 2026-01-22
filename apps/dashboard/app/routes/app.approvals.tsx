import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({});
};

export default function Approvals() {
  return (
    <Page
      title="Approval Queue"
      backAction={{ url: "/app" }}
      subtitle="Review AI-generated changes"
    >
      <Layout>
        <Layout.Section>
          <Banner title="Approval Workflow Coming Soon" tone="info">
            <p>
              This page will display AI-generated changes that require manual review before being applied to your store.
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                Planned Features
              </Text>
              <Text as="p" variant="bodyMd">
                • Review pending AI-generated changes
              </Text>
              <Text as="p" variant="bodyMd">
                • Approve or reject suggestions
              </Text>
              <Text as="p" variant="bodyMd">
                • View confidence scores
              </Text>
              <Text as="p" variant="bodyMd">
                • Bulk approval operations
              </Text>
              <Text as="p" variant="bodyMd">
                • Approval history and audit log
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
