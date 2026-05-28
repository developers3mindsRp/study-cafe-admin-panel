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
      type: "date-range";
      id: string;
      label: string;
      /** id for the "from" date value; defaults to `${id}_from` */
      fromId?: string;
      /** id for the "to" date value; defaults to `${id}_to` */
      toId?: string;
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
    };

export type FilterValues = Record<string, string>;
