import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";

type AIContainerCardProps = {
    title: string,
    result?: string,
}

export default function AIContainerCard({
    title,
    result
}: AIContainerCardProps) {
    return (
        <Card className="pt-2 pb-0 flex flex-col overflow-hidden">
            <CardContent className="flex flex-col h-full">
                <Accordion type="single" collapsible className="flex flex-col h-full">
                    <AccordionItem value="item-1" className="flex flex-col h-full pb-0">
                        <AccordionTrigger>
                            <Label type="subtitle" className="gradient-text">{title}</Label>
                        </AccordionTrigger>

                        <AccordionContent className="h-full pb-0 relative">
                            <div className="h-full">
                                {result ? (<div className="overflow-y-scroll rounded-xl bg-accent p-4 h-full">
                                    {result}
                                </div>) : (
                                    <div className="flex flex-col gap-4 pb-4">
                                        <Skeleton className="h-[20px] w-full rounded-full" />
                                        <Skeleton className="h-[20px] w-full rounded-full" />
                                        <Skeleton className="h-[20px] w-full rounded-full" />
                                        <Skeleton className="h-[20px] w-full rounded-full" />
                                    </div>
                                )
                                }
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}