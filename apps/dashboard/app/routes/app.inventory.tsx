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

export default function Inventory() {
  return (
    <Page
      title="Inventory Forecasting"
      backAction={{ url: "/app" }}
      subtitle="AI-powered demand prediction"
    >
      <Layout>
        <Layout.Section>
          <Banner title="Inventory AI Coming Soon" tone="info">
            <p>
              This feature will use AI to predict product demand and suggest optimal inventory levels.
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
                • Demand forecasting based on sales history
              </Text>
              <Text as="p" variant="bodyMd">
                • Seasonal trend analysis
              </Text>
              <Text as="p" variant="bodyMd">
                • Low stock alerts
              </Text>
              <Text as="p" variant="bodyMd">
                • Optimal reorder point calculations
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
