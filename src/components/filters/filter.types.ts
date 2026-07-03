export type SelectOption = {
  value: string;
  label: string;
};

export type FilterFieldDef =
  | {
      type: "select";
      id: string;
      label: string;
      options: SelectOption[];
      placeholder?: string;
    }
  | {
      type: "async-select";
      id: string;
      label: string;
      loader: () => Promise<SelectOption[]>;
      placeholder?: string;
    }
  | {
      type: "searchable-async-select";
      id: string;
      label: string;
      loader: (search: string) => Promise<SelectOption[]>;
      resolveOption?: (value: string) => Promise<SelectOption | null>;
      placeholder?: string;
      searchPlaceholder?: string;
      /** Minimum characters before search runs; defaults to 2. */
      minSearchLength?: number;
      /** When true, loads options on open (e.g. first page without typing). */
      defaultOptions?: boolean;
      /** Optional grid column class when FilterBar layout is "full". */
      className?: string;
    }
  | {
      type: "amount-range";
      id: string;
      label: string;
      minId?: string;
      maxId?: string;
      sliderMax?: number;
      /** Slider/input step; defaults to 1 in filters. */
      step?: number;
      /** Snap typed values on blur; off by default for fine-grained filters. */
      snapOnBlur?: boolean;
      /** Show dual-thumb slider in dropdown; off by default (min/max inputs only). */
      showSlider?: boolean;
      className?: string;
    }
  | {
      type: "date-range";
      id: string;
      label: string;
      /** id for the "from" date value; defaults to `${id}_from` */
      fromId?: string;
      /** id for the "to" date value; defaults to `${id}_to` */
      toId?: string;
      className?: string;
    }
  | {
      type: "text";
      id: string;
      label: string;
      placeholder?: string;
    }
  | {
      type: "number-range";
      id: string;
      label: string;
      /** id for the min value; defaults to `${id}_min` */
      minId?: string;
      /** id for the max value; defaults to `${id}_max` */
      maxId?: string;
      placeholder?: string;
    }
  | {
      type: "month-select";
      id: string;
      label: string;
      /** id for the first-day-of-month value; defaults to `${id}_from` */
      fromId?: string;
      /** id for the last-day-of-month value; defaults to `${id}_to` */
      toId?: string;
      placeholder?: string;
    }
  | {
      type: "date-split";
      id: string;
      label: string;
      /** id for the "from" date value; defaults to `${id}From` */
      fromId?: string;
      /** label shown above the "from" picker; defaults to "From" */
      fromLabel?: string;
      /** id for the "to" date value; defaults to `${id}To` */
      toId?: string;
      /** label shown above the "to" picker; defaults to "To" */
      toLabel?: string;
    }
  | {
      type: "date";
      id: string;
      label: string;
      placeholder?: string;
    };

export type FilterValues = Record<string, string>;
