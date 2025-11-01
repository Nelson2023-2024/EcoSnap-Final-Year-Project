const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    pointsCost: {
      type: Number,
      required: true,
      min: 0,
    },
    images: [
      {
        url: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    // Product specifications (flexible for different product types)
    specifications: {
      type: Map,
      of: String,
      // Examples:
      // For tree seedlings: { height: "30cm", age: "6 months", species: "Mango" }
      // For bins: { capacity: "50L", material: "Recycled plastic", color: "Green" }
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ pointsCost: 1 });

export const Product = mongoose.model("Product", productSchema);