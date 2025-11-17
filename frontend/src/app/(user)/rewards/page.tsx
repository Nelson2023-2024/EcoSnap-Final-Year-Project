"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, LoaderIcon } from "lucide-react";
import { useAuthUser } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProduct";
import { useRedeemProduct } from "@/hooks/useRedeem";
import { useRouter } from "next/navigation";

const Rewards = () => {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useAuthUser();
  const { data: products, isLoading: productsLoading, error } = useProducts();
  const { mutate: redeemProduct, isPending: isRedeeming } = useRedeemProduct();

  const handleRedeem = (productId: string, productName: string) => {
    redeemProduct(productId, {
      onSuccess: () => {
        // Redirect to success page after successful redemption
        router.push(`/rewards/success?productName=${encodeURIComponent(productName)}`);
      },
    });
  };

  if (userLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoaderIcon className="h-8 w-8 animate-spin text-eco-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-red-500">Failed to load products</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Rewards Store</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Redeem your points for eco-friendly items
          </p>

          <Card className="inline-block p-6 bg-eco-primary text-white">
            <Award className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm opacity-90">Your Points</p>
            <p className="text-4xl font-bold">{user?.points || 0}</p>
          </Card>
        </div>

        {!products || products.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-xl text-muted-foreground">No products available at the moment</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {products
              .filter((item) => item.product_isAvailable)
              .map((item) => {
                const canAfford = user && user.points >= item.product_pointsCost;
                const outOfStock = item.product_stock === 0;

                return (
                  <Card key={item.product_id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="h-48 w-full mb-3 rounded-lg overflow-hidden border-2 border-eco-primary/20">
                      <img
                        src={item.product_imageURL}
                        alt={item.product_name}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>

                    <h3 className="text-lg font-bold text-center mb-2">
                      {item.product_name}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground text-center mb-3">
                      {item.product_description}
                    </p>

                    <div className="text-center mb-2">
                      <span className="text-2xl font-bold text-eco-primary">
                        {item.product_pointsCost}
                      </span>
                      <span className="text-muted-foreground ml-1">points</span>
                    </div>

                    <p className="text-sm text-center text-muted-foreground mb-3">
                      Stock: {item.product_stock}
                    </p>

                    <Button
                      className="w-full bg-eco-primary hover:bg-eco-primary/90 cursor-pointer"
                      disabled={!canAfford || outOfStock || isRedeeming}
                      onClick={() => handleRedeem(item.product_id, item.product_name)}
                    >
                      {isRedeeming ? (
                        <>
                          <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                          Redeeming...
                        </>
                      ) : outOfStock ? (
                        "Out of Stock"
                      ) : canAfford ? (
                        "Redeem"
                      ) : (
                        "Not Enough Points"
                      )}
                    </Button>
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rewards;