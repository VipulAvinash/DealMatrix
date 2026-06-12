import mongoose from "mongoose";

const priceSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  originalAmount: { type: Number, default: null },
  discountPercent: { type: Number, default: 0 },
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      index: true,
    },
    price: priceSchema,
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    availability: {
      inStock: { type: Boolean, default: true },
      stockCount: { type: Number, default: null },
      deliveryEstimate: { type: String, default: null },
    },
    seller: {
      name: { type: String, default: null },
      rating: { type: Number, default: null },
    },
    images: [String],
    specifications: {
      type: Map,
      of: String,
    },
    features: [String],
    source: {
      platform: {
        type: String,
        enum: ["amazon", "flipkart", "reliance", "croma", "other"],
        required: true,
      },
      url: { type: String, default: null },
      productId: { type: String, default: null },
    },
    searchQuery: {
      type: String,
      index: true,
    },
    aiSummary: {
      type: String,
      default: null,
    },
    tags: [String],
    embeddings: {
      type: [Number],
      select: false, // Don't return embeddings by default
    },
    cacheKey: {
      type: String,
      index: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
productSchema.index({ searchQuery: 1, "source.platform": 1 });
productSchema.index({ "price.amount": 1 });
productSchema.index({ "rating.average": -1 });
productSchema.index({ brand: 1, category: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: "text", description: "text", brand: "text" });

// ─── Virtuals ────────────────────────────────────────────────────────────────
productSchema.virtual("discountedPrice").get(function () {
  if (this.price?.discountPercent > 0) {
    return this.price.amount * (1 - this.price.discountPercent / 100);
  }
  return this.price?.amount;
});

const Product = mongoose.model("Product", productSchema);
export default Product;
