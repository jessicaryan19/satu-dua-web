import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { AIRecommendation } from "@/services/ai-recommendation-service";

type AIContainerCardProps = {
    title: string,
    result?: string,
    aiRecommendation?: AIRecommendation,
    loading?: boolean
}

export default function AIContainerCard({
    title,
    result,
    aiRecommendation,
    loading = false
}: AIContainerCardProps) {
    
    // If we have an AI recommendation, format it nicely
    const formatAIRecommendation = (recommendation: AIRecommendation) => {
        const keyIndicators = recommendation.key_indicators as any;
        
        return (
            <div className="space-y-4">
                {/* Suggestion */}
                {recommendation.suggestion && (
                    <div>
                        <h4 className="font-medium text-sm mb-2">Suggested Action:</h4>
                        <p className="text-sm">{recommendation.suggestion}</p>
                    </div>
                )}
                
                {/* Analysis */}
                {recommendation.analysis && (
                    <div>
                        <h4 className="font-medium text-sm mb-2">Analysis:</h4>
                        <p className="text-sm">{recommendation.analysis}</p>
                    </div>
                )}
                
                {/* Key Indicators */}
                {keyIndicators && (
                    <div>
                        <h4 className="font-medium text-sm mb-2">Key Information:</h4>
                        <div className="space-y-2">
                            {keyIndicators.is_prank_call !== undefined && (
                                <div className="flex items-center gap-2">
                                    <Badge variant={keyIndicators.is_prank_call ? "destructive" : "secondary"}>
                                        {keyIndicators.is_prank_call ? "Potential Prank Call" : "Legitimate Call"}
                                    </Badge>
                                </div>
                            )}
                            
                            {keyIndicators.confidence_score !== undefined && (
                                <div className="text-sm">
                                    <span className="font-medium">Confidence Score:</span> {(keyIndicators.confidence_score * 100).toFixed(1)}%
                                </div>
                            )}
                            
                            {keyIndicators.trust_score !== undefined && (
                                <div className="text-sm">
                                    <span className="font-medium">Trust Score:</span> {(keyIndicators.trust_score * 100).toFixed(1)}%
                                </div>
                            )}
                            
                            {keyIndicators.location && (
                                <div className="text-sm">
                                    <span className="font-medium">Location:</span> {keyIndicators.location}
                                </div>
                            )}
                            
                            {keyIndicators.escalation_required && (
                                <div>
                                    <Badge variant="destructive">Escalation Required</Badge>
                                </div>
                            )}
                            
                            {keyIndicators.key_indicators && Array.isArray(keyIndicators.key_indicators) && (
                                <div>
                                    <h5 className="font-medium text-sm mb-1">Key Indicators:</h5>
                                    <ul className="text-sm list-disc list-inside space-y-1">
                                        {keyIndicators.key_indicators.map((indicator: string, index: number) => (
                                            <li key={index}>{indicator}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {keyIndicators.current_status && (
                                <div className="text-sm">
                                    <span className="font-medium">Status:</span> {keyIndicators.current_status}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Timestamp */}
                {recommendation.created_at && (
                    <div className="text-xs text-muted-foreground border-t pt-2">
                        Last updated: {new Date(recommendation.created_at).toLocaleString()}
                    </div>
                )}
            </div>
        );
    };

    const displayContent = aiRecommendation ? formatAIRecommendation(aiRecommendation) : result;

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
                                {loading ? (
                                    <div className="flex flex-col gap-4 pb-4">
                                        <Skeleton className="h-[20px] w-full rounded-full" />
                                        <Skeleton className="h-[20px] w-full rounded-full" />
                                        <Skeleton className="h-[20px] w-full rounded-full" />
                                        <Skeleton className="h-[20px] w-full rounded-full" />
                                    </div>
                                ) : displayContent ? (
                                    <div className="overflow-y-scroll rounded-xl bg-accent p-4 h-full">
                                        {displayContent}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4 pb-4">
                                        <Skeleton className="h-[20px] w-full rounded-full" />
                                        <Skeleton className="h-[20px] w-full rounded-full" />
                                        <Skeleton className="h-[20px] w-full rounded-full" />
                                        <Skeleton className="h-[20px] w-full rounded-full" />
                                    </div>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}