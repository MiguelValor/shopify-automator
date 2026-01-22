import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Card,
  DataTable,
  Button,
  Badge,
  BlockStack,
  Banner,
  Text,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Fetch products
  const response = await admin.graphql(
    `#graphql
    query {
      products(first: 50) {
        edges {
          node {
            id
            title
            description
            seo {
              title
              description
            }
            tags
            vendor
            status
          }
        }
      }
    }`
  );

  const data = await response.json();
  const products = data.data.products.edges.map((edge: any) => edge.node);

  // Filter products that need optimization
  const needsOptimization = products.filter(
    (p: any) => !p.seo?.description || p.seo.description.length < 50
  );

  return json({
    products: needsOptimization,
    allProducts: products,
    shop: session.shop,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const productId = formData.get("productId") as string;
  const action = formData.get("action") as string;

  if (action === "optimize") {
    try {
      // Get product details
      const productResponse = await admin.graphql(
        `#graphql
        query($id: ID!) {
          product(id: $id) {
            title
            description
            vendor
            tags
            seo {
              title
              description
            }
          }
        }`,
        { variables: { id: productId } }
      );

      const productData = await productResponse.json();
      const product = productData.data.product;

      // Call Product-AI microservice for SEO generation
      const productAIUrl = process.env.PRODUCT_AI_URL || "http://localhost:3001";

      const seoResponse = await fetch(`${productAIUrl}/generate-seo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: product.title,
          description: product.description || product.title,
          vendor: product.vendor,
          tags: product.tags,
        }),
      });

      const seoResult = await seoResponse.json();

      if (seoResult.success) {
        const { metaTitle, metaDescription, confidence } = seoResult.data;

        // High confidence: Apply directly
        if (confidence > 0.8) {
          const updateResponse = await admin.graphql(
            `#graphql
            mutation updateProduct($input: ProductInput!) {
              productUpdate(input: $input) {
                product {
                  id
                  seo {
                    title
                    description
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
            {
              variables: {
                input: {
                  id: productId,
                  seo: {
                    title: metaTitle,
                    description: metaDescription,
                  },
                },
              },
            }
          );

          const updateData = await updateResponse.json();

          if (updateData.data.productUpdate.userErrors.length === 0) {
            return json({
              success: true,
              message: "Product optimized successfully!",
              confidence,
            });
          } else {
            return json({
              success: false,
              message: "Failed to update product",
              errors: updateData.data.productUpdate.userErrors,
            });
          }
        } else {
          // Low confidence: Create approval request
          const workflowUrl = process.env.WORKFLOW_ENGINE_URL || "http://localhost:3003";

          await fetch(`${workflowUrl}/create-approval`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              shopId: session.shop,
              actionType: "product_update",
              entityType: "product",
              entityId: productId,
              currentData: product.seo,
              proposedData: { metaTitle, metaDescription },
              confidence,
              reasoning: `AI-generated SEO with ${(confidence * 100).toFixed(0)}% confidence`,
            }),
          });

          return json({
            success: true,
            message: "Approval request created for manual review",
            confidence,
          });
        }
      } else {
        return json({
          success: false,
          message: "Failed to generate SEO optimization",
        });
      }
    } catch (error) {
      console.error("Optimization error:", error);
      return json({
        success: false,
        message: "Error optimizing product: " + (error as Error).message,
      });
    }
  }

  return json({ success: false, message: "Unknown action" });
};

export default function ProductOptimize() {
  const { products, allProducts } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isProcessing = navigation.state === "submitting";

  const handleOptimize = (productId: string) => {
    setProcessingId(productId);
    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("action", "optimize");
    submit(formData, { method: "post" });
  };

  const rows = products.map((product: any) => {
    const seoLength = product.seo?.description?.length || 0;
    const isCurrentlyProcessing = isProcessing && processingId === product.id;

    return [
      product.title,
      product.vendor || "N/A",
      <Badge tone={seoLength > 50 ? "success" : "warning"} key={`badge-${product.id}`}>
        {seoLength > 50 ? `${seoLength} chars` : "Missing"}
      </Badge>,
      <Button
        key={`button-${product.id}`}
        onClick={() => handleOptimize(product.id)}
        loading={isCurrentlyProcessing}
        disabled={isProcessing}
      >
        {isCurrentlyProcessing ? "Optimizing..." : "Optimize with AI"}
      </Button>,
    ];
  });

  return (
    <Page
      title="Product SEO Optimization"
      backAction={{ url: "/app" }}
      subtitle="AI-powered optimization using Gemini"
    >
      <Layout>
        <Layout.Section>
          <Banner title="AI-Powered SEO Optimization" tone="info">
            <p>
              Our AI analyzes your products and generates optimized SEO titles and descriptions.
              Products with high confidence (80%+) are updated automatically. Lower confidence
              suggestions require manual approval.
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Products Needing Optimization
                </Text>
                <Badge tone={products.length > 0 ? "warning" : "success"}>
                  {products.length} of {allProducts.length} products
                </Badge>
              </InlineStack>

              {products.length > 0 ? (
                <DataTable
                  columnContentTypes={["text", "text", "text", "text"]}
                  headings={["Product Title", "Vendor", "SEO Status", "Action"]}
                  rows={rows}
                />
              ) : (
                <Banner tone="success">
                  <p>All products have SEO optimization! Great work!</p>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                How it works
              </Text>
              <Text as="p" variant="bodyMd">
                1. Click "Optimize with AI" on any product
              </Text>
              <Text as="p" variant="bodyMd">
                2. Our Gemini AI analyzes the product and generates SEO metadata
              </Text>
              <Text as="p" variant="bodyMd">
                3. High-confidence suggestions (80%+) are applied automatically
              </Text>
              <Text as="p" variant="bodyMd">
                4. Lower-confidence suggestions go to the approval queue
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
