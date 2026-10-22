import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { Recognition } from "@/components/sections/recognition";
import { Stack } from "@/components/sections/stack";
import { Work } from "@/components/sections/work";

export default function Home() {
  return (
    <>
      <Hero />
      <Work />
      <Experience />
      <Stack />
      <Recognition />
      <About />
      <Contact />
    </>
  );
}
