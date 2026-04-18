import { React } from "/modules/stdlib/src/expose/React.ts";

export interface SearchbarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}
export const Searchbar = (props: SearchbarProps) => {
  return (
    <div className="flex flex-col flex-grow items-end">
      <input
        className="!bg-[var(--backdrop)] border-[var(--spice-sidebar)] !text-[var(--text-base)] border-solid h-8 py-2 px-3 rounded-lg"
        onChange={(event) => {
          props.onChange(event.target.value);
        }}
        placeholder={props.placeholder}
        type="text"
        value={props.value}
      />
    </div>
  );
};

export const useSearchbar = (placeholder: string) => {
  const [value, setValue] = React.useState("");

  const searchbar = (
    <Searchbar
      onChange={(str) => {
        setValue(str);
      }}
      placeholder={placeholder}
      value={value}
    />
  );

  return [searchbar, value] as const;
};
