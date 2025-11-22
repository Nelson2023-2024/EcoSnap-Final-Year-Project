"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, Coins, Trash2, Edit, LoaderIcon, Upload, X } from "lucide-react";
import { useProducts, useCreateProduct, useDeleteProduct, useUpdateProduct } from "@/hooks/useProduct";
import { toast } from "react-hot-toast";
import Image from "next/image";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Products() {
  const { data: products, isLoading, error } = useProducts();
  const createProductMutation = useCreateProduct();
  const deleteProductMutation = useDeleteProduct();
  const updateProductMutation = useUpdateProduct();

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [productName, setProductName] = React.useState("");
  const [productDescription, setProductDescription] = React.useState("");
  const [productPointsCost, setProductPointsCost] = React.useState("");
  const [productStock, setProductStock] = React.useState("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string>("");

  // Update dialog state
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
  const [updateProductName, setUpdateProductName] = React.useState("");
  const [updateProductDescription, setUpdateProductDescription] = React.useState("");
  const [updateProductPointsCost, setUpdateProductPointsCost] = React.useState("");
  const [updateProductStock, setUpdateProductStock] = React.useState("");
  const [updateProductIsAvailable, setUpdateProductIsAvailable] = React.useState<string>("true");
  const [updateImageFile, setUpdateImageFile] = React.useState<File | null>(null);
  const [updateImagePreview, setUpdateImagePreview] = React.useState<string>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setUpdateImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpdateImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const handleRemoveUpdateImage = () => {
    setUpdateImageFile(null);
    setUpdateImagePreview("");
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName || !productDescription || !productPointsCost || !productStock || !imageFile) {
      toast.error("All fields including image are required");
      return;
    }

    if (Number(productPointsCost) < 0 || Number(productStock) < 0) {
      toast.error("Points cost and stock must be non-negative");
      return;
    }

    try {
      await createProductMutation.mutateAsync({
        productName,
        productDescription,
        productPointsCost: Number(productPointsCost),
        productStock: Number(productStock),
        productImage: imageFile,
      });
      setCreateDialogOpen(false);
      setProductName("");
      setProductDescription("");
      setProductPointsCost("");
      setProductStock("");
      setImageFile(null);
      setImagePreview("");
    } catch (err) {
      // Error is already handled in the hook
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${productName}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteProductMutation.mutateAsync(productId);
      } catch (err) {
        // Error is already handled in the hook
      }
    }
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setUpdateProductName(product.product_name);
    setUpdateProductDescription(product.product_description);
    setUpdateProductPointsCost(product.product_pointsCost.toString());
    setUpdateProductStock(product.product_stock.toString());
    setUpdateProductIsAvailable(product.product_isAvailable ? "true" : "false");
    setUpdateImagePreview("");
    setUpdateImageFile(null);
    setUpdateDialogOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!updateProductName || !updateProductDescription || !updateProductPointsCost || !updateProductStock) {
      toast.error("All fields are required");
      return;
    }

    if (Number(updateProductPointsCost) < 0 || Number(updateProductStock) < 0) {
      toast.error("Points cost and stock must be non-negative");
      return;
    }

    try {
      await updateProductMutation.mutateAsync({
        id: selectedProduct._id,
        productName: updateProductName,
        productDescription: updateProductDescription,
        productPointsCost: Number(updateProductPointsCost),
        productStock: Number(updateProductStock),
        productIsAvailable: updateProductIsAvailable === "true",
        productImage: updateImageFile || undefined,
      });
      setUpdateDialogOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      // Error is already handled in the hook
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 py-10">Failed to load products</p>;
  }

  if (!products || products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Products Catalog</h2>
            <p className="text-muted-foreground">Eco-friendly items users can purchase with points</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Enter product details below and upload an image to add a new eco-friendly product.
                </DialogDescription>
              </DialogHeader>

              <form className="grid gap-4" onSubmit={handleCreateProduct}>
                <div className="grid gap-3">
                  <Label htmlFor="image">Product Image *</Label>
                  <div className="flex flex-col gap-3">
                    {imagePreview ? (
                      <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                        <Image
                          src={imagePreview}
                          alt="Product preview"
                          fill
                          className="object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <Label htmlFor="image-upload" className="cursor-pointer">
                          <span className="text-sm text-muted-foreground">
                            Click to upload product image
                          </span>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </Label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    placeholder="e.g., Recycling Bin Set"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="productDescription">Description *</Label>
                  <Textarea
                    id="productDescription"
                    placeholder="Describe the product..."
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-3">
                    <Label htmlFor="productPointsCost">Points Cost *</Label>
                    <Input
                      id="productPointsCost"
                      type="number"
                      placeholder="e.g., 500"
                      value={productPointsCost}
                      onChange={(e) => setProductPointsCost(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="productStock">Stock *</Label>
                    <Input
                      id="productStock"
                      type="number"
                      placeholder="e.g., 100"
                      value={productStock}
                      onChange={(e) => setProductStock(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={createProductMutation.isPending}>
                    {createProductMutation.isPending ? "Adding..." : "Add Product"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-center py-10">No products available. Add your first product!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Products Catalog</h2>
          <p className="text-muted-foreground">Eco-friendly items users can purchase with points</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Enter product details below and upload an image to add a new eco-friendly product.
              </DialogDescription>
            </DialogHeader>

            <form className="grid gap-4" onSubmit={handleCreateProduct}>
              <div className="grid gap-3">
                <Label htmlFor="image">Product Image *</Label>
                <div className="flex flex-col gap-3">
                  {imagePreview ? (
                    <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                      <Image
                        src={imagePreview}
                        alt="Product preview"
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <span className="text-sm text-muted-foreground">
                          Click to upload product image
                        </span>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </Label>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  placeholder="e.g., Recycling Bin Set"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="productDescription">Description *</Label>
                <Textarea
                  id="productDescription"
                  placeholder="Describe the product..."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-3">
                  <Label htmlFor="productPointsCost">Points Cost *</Label>
                  <Input
                    id="productPointsCost"
                    type="number"
                    placeholder="e.g., 500"
                    value={productPointsCost}
                    onChange={(e) => setProductPointsCost(e.target.value)}
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="productStock">Stock *</Label>
                  <Input
                    id="productStock"
                    type="number"
                    placeholder="e.g., 100"
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={createProductMutation.isPending}>
                  {createProductMutation.isPending ? "Adding..." : "Add Product"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product: any) => (
          <Card
            key={product._id}
            className={`hover:shadow-lg transition-shadow overflow-hidden ${
              !product.product_isAvailable && "opacity-60"
            }`}
          >
            {product.product_imageURL && (
              <div className="relative w-full h-48">
                <Image
                  src={product.product_imageURL}
                  alt={product.product_name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                    <Package className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{product.product_name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {product.product_description}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(product._id, product.product_name)}
                  disabled={deleteProductMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-warning" />
                  <span className="text-lg font-bold text-foreground">
                    {product.product_pointsCost}
                  </span>
                  <span className="text-sm text-muted-foreground">points</span>
                </div>
                {product.product_isAvailable && product.product_stock > 0 ? (
                  <Badge variant="default">In Stock</Badge>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Available Stock</span>
                  <span
                    className={`font-medium ${
                      product.product_stock === 0 ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {product.product_stock} units
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleEditProduct(product)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Update Product Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Product</DialogTitle>
            <DialogDescription>
              Update product details below and click save to apply changes.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleUpdateSubmit}>
            {selectedProduct?.product_imageURL && !updateImagePreview && (
              <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                <Image
                  src={selectedProduct.product_imageURL}
                  alt="Current product image"
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="grid gap-3">
              <Label htmlFor="update-image">Update Product Image (Optional)</Label>
              <div className="flex flex-col gap-3">
                {updateImagePreview ? (
                  <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                    <Image
                      src={updateImagePreview}
                      alt="Product preview"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveUpdateImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <Label htmlFor="update-image-upload" className="cursor-pointer">
                      <span className="text-sm text-muted-foreground">
                        Click to upload new image
                      </span>
                      <Input
                        id="update-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpdateImageChange}
                      />
                    </Label>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="update-productName">Product Name</Label>
              <Input
                id="update-productName"
                placeholder="e.g., Recycling Bin Set"
                value={updateProductName}
                onChange={(e) => setUpdateProductName(e.target.value)}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="update-productDescription">Description</Label>
              <Textarea
                id="update-productDescription"
                placeholder="Describe the product..."
                value={updateProductDescription}
                onChange={(e) => setUpdateProductDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-3">
                <Label htmlFor="update-productPointsCost">Points Cost</Label>
                <Input
                  id="update-productPointsCost"
                  type="number"
                  placeholder="e.g., 500"
                  value={updateProductPointsCost}
                  onChange={(e) => setUpdateProductPointsCost(e.target.value)}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="update-productStock">Stock</Label>
                <Input
                  id="update-productStock"
                  type="number"
                  placeholder="e.g., 100"
                  value={updateProductStock}
                  onChange={(e) => setUpdateProductStock(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="update-availability">Availability</Label>
              <Select
                value={updateProductIsAvailable}
                onValueChange={setUpdateProductIsAvailable}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Availability</SelectLabel>
                    <SelectItem value="true">Available</SelectItem>
                    <SelectItem value="false">Not Available</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={updateProductMutation.isPending}>
                {updateProductMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}