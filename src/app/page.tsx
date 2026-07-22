import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { Solution } from "@/components/sections/solution";
import { ProductShowcase } from "@/components/sections/product-showcase";
import { Features } from "@/components/sections/features";
import { AIEngine } from "@/components/sections/ai-engine";
import { WhyChoose } from "@/components/sections/why-choose";
import { Pricing } from "@/components/sections/pricing";
import { FAQ } from "@/components/sections/faq";

export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <Solution />
      <ProductShowcase />
      <Features />
      <AIEngine />
      <WhyChoose />
      <Pricing />
      <FAQ />
    </>
  );
}
