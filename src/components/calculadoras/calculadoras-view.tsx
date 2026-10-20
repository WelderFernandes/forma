"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BmiCalculator } from "@/components/calculadoras/bmi-calculator";
import { BodyFatCalculator } from "@/components/calculadoras/body-fat-calculator";
import { EnergyCalculator } from "@/components/calculadoras/energy-calculator";
import { MacrosCalculator } from "@/components/calculadoras/macros-calculator";
import { OneRmCalculator } from "@/components/calculadoras/one-rm-calculator";
import { PlatesCalculator } from "@/components/calculadoras/plates-calculator";

export function CalculadorasView() {
  return (
    <Tabs defaultValue="imc" className="space-y-4">
      <TabsList className="h-auto flex-wrap">
        <TabsTrigger value="imc">IMC</TabsTrigger>
        <TabsTrigger value="tmb">TMB e TDEE</TabsTrigger>
        <TabsTrigger value="macros">Macros</TabsTrigger>
        <TabsTrigger value="rm">Carga máxima</TabsTrigger>
        <TabsTrigger value="anilhas">Anilhas</TabsTrigger>
        <TabsTrigger value="gordura">Gordura corporal</TabsTrigger>
      </TabsList>

      <TabsContent value="imc">
        <BmiCalculator />
      </TabsContent>
      <TabsContent value="tmb">
        <EnergyCalculator />
      </TabsContent>
      <TabsContent value="macros">
        <MacrosCalculator />
      </TabsContent>
      <TabsContent value="rm">
        <OneRmCalculator />
      </TabsContent>
      <TabsContent value="anilhas">
        <PlatesCalculator />
      </TabsContent>
      <TabsContent value="gordura">
        <BodyFatCalculator />
      </TabsContent>
    </Tabs>
  );
}
