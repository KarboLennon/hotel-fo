"use client";
import { Button } from "@/components/ui/button";
export function PrintButton() { return <Button type="button" onClick={() => window.print()} className="no-print">Print</Button>; }
