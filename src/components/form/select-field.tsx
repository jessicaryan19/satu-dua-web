import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

type SelectFieldProps = {
    selectOptions: string[],
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
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}