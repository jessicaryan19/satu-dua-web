import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export type SelectOption = {
  value: string,
  label: string,
}

export type SelectFieldProps = {
  selectOptions: SelectOption[],
  placeholder: string,
  value?: string,
  onValueChange?: (value: string) => void,
}

export function SelectField({
  selectOptions,
  placeholder,
  value,
  onValueChange,
}: SelectFieldProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
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
