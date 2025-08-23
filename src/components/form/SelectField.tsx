import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export type SelectOption = {
    value: string,
    label: string,
}
type SelectFieldProps = {
    selectOptions: SelectOption[],
    placeholder: string,
}

export function SelectField({
    selectOptions,
    placeholder,
}: SelectFieldProps) {
    return (
        <Select>
            <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {selectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}