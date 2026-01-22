import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  InlineStack,
  Button,
  Banner,
  List,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Fetch products that need optimization
  const productsResponse = await admin.graphql(
    `#graphql
    query {
      products(first: 10) {
        edges {
          node {
            id
            title
            status
            seo {
              title
              description
            }
          }
        }
      }
    }`
  );

  const productsData = await productsResponse.json();
  const products = productsData.data.products.edges.map((edge: any) => edge.node);

  // Count products needing optimization
  const needsSEO = products.filter(
    (p: any) => !p.seo?.description || p.seo.description.length < 50
  ).length;

  return json({
    shop: session.shop,
    totalProducts: products.length,
    needsSEO,
    products,
  });
};

export default function Index() {
  const { shop, totalProducts, needsSEO, products } = useLoaderData<typeof loader>();

  return (
    <Page title="AI Automation Dashboard">
      <Layout>
        <Layout.Section>
          <Banner title="Welcome to AI-Powered Automation" tone="success">
            <p>Your intelligent assistant for product optimization, inventory management, and automated workflows.</p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Store Overview
              </Text>
              <InlineStack gap="400">
                <div>
                  <Text as="p" variant="bodyMd" fontWeight="bold">
                    Connected Store
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {shop}
                  </Text>
                </div>
                <div>
                  <Text as="p" variant="bodyMd" fontWeight="bold">
                    Total Products
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {totalProducts}
                  </Text>
                </div>
                <div>
                  <Text as="p" variant="bodyMd" fontWeight="bold">
                    Needs SEO Optimization
                  </Text>
                  <Badge tone={needsSEO > 0 ? "warning" : "success"}>
                    {needsSEO} products
                  </Badge>
                </div>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                AI Features
              </Text>
              <List type="bullet">
                <List.Item>Product SEO Optimization with Gemini AI</List.Item>
                <List.Item>Automated Product Description Enhancement</List.Item>
                <List.Item>Inventory Demand Forecasting</List.Item>
                <List.Item>Smart Tag Generation</List.Item>
                <List.Item>Approval Workflow Management</List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Quick Actions
              </Text>
              <InlineStack gap="300">
                <Link to="/app/products/optimize" style={{ textDecoration: 'none' }}>
                  <Button variant="primary">
                    Optimize Products ({needsSEO} need attention)
                  </Button>
                </Link>
                <Link to="/app/inventory" style={{ textDecoration: 'none' }}>
                  <Button>View Inventory Forecast</Button>
                </Link>
                <Link to="/app/approvals" style={{ textDecoration: 'none' }}>
                  <Button>Review Approvals</Button>
                </Link>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Recent Products
              </Text>
              {products.length > 0 ? (
                <BlockStack gap="200">
                  {products.slice(0, 5).map((product: any) => (
                    <InlineStack key={product.id} align="space-between">
                      <Text as="p" variant="bodyMd">
                        {product.title}
                      </Text>
                      <Badge tone={product.seo?.description ? "success" : "warning"}>
                        {product.seo?.description ? "SEO Ready" : "Needs SEO"}
                      </Badge>
                    </InlineStack>
                  ))}
                </BlockStack>
              ) : (
                <Text as="p" variant="bodyMd">
                  No products found. Add products to your store to get started.
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
