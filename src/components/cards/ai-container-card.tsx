import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";

export default function AIContainerCard() {
    return (
        <Card className="py-2">
            <CardContent >
                <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                        <AccordionTrigger>
                            <Label type="subtitle" className="bg-[var(--gradient-primary)] bg-clip-text text-transparent">Analisa Kejadian</Label>
                        </AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4 text-balance">
                            <div>

                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    )
}