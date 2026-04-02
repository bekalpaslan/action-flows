export interface ComponentManifestEntry {
  name: string;
  importPath: string;
  description: string;
  variants: Record<string, string[]>;
  defaultVariants: Record<string, string>;
  sizes: string[];
  subComponents: string[];
  radixPrimitive: string | null;
  props: Record<string, {
    type: string;
    required: boolean;
    description: string;
  }>;
}

export const componentManifest: ComponentManifestEntry[] = [
  {
    name: 'Button',
    importPath: '@/components/ui/button',
    description: 'Primary interactive element for user actions. Supports polymorphic rendering via asChild.',
    variants: {
      variant: ['primary', 'secondary', 'ghost', 'destructive', 'outline'],
    },
    defaultVariants: { variant: 'primary', size: 'md' },
    sizes: ['sm', 'md', 'lg', 'icon'],
    subComponents: [],
    radixPrimitive: '@radix-ui/react-slot',
    props: {
      asChild: { type: 'boolean', required: false, description: 'Render as child element for polymorphic composition' },
      variant: { type: "'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'", required: false, description: 'Visual style variant' },
      size: { type: "'sm' | 'md' | 'lg' | 'icon'", required: false, description: 'Button size. Icon-only buttons MUST include aria-label.' },
    },
  },
  {
    name: 'Card',
    importPath: '@/components/ui/card',
    description: 'Container for grouped content with optional elevation and interaction.',
    variants: {
      variant: ['flat', 'raised', 'floating'],
      interactive: ['true', 'false'],
    },
    defaultVariants: { variant: 'flat', interactive: 'false' },
    sizes: [],
    subComponents: ['CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter'],
    radixPrimitive: null,
    props: {
      variant: { type: "'flat' | 'raised' | 'floating'", required: false, description: 'Elevation style' },
      interactive: { type: 'boolean', required: false, description: 'Adds hover border and cursor-pointer' },
    },
  },
  {
    name: 'Badge',
    importPath: '@/components/ui/badge',
    description: 'Small label for status indicators, counts, and categorical tags.',
    variants: {
      variant: ['default', 'success', 'warning', 'error', 'info', 'accent'],
    },
    defaultVariants: { variant: 'default', size: 'md' },
    sizes: ['sm', 'md'],
    subComponents: [],
    radixPrimitive: null,
    props: {
      variant: { type: "'default' | 'success' | 'warning' | 'error' | 'info' | 'accent'", required: false, description: 'Semantic color variant' },
      size: { type: "'sm' | 'md'", required: false, description: 'Badge size' },
    },
  },
  {
    name: 'Avatar',
    importPath: '@/components/ui/avatar',
    description: 'User or agent avatar with image support and initials fallback.',
    variants: {},
    defaultVariants: { size: 'md' },
    sizes: ['sm', 'md', 'lg', 'xl'],
    subComponents: [],
    radixPrimitive: null,
    props: {
      src: { type: 'string | null', required: false, description: 'Image URL. Falls back to initials if not provided or on error.' },
      alt: { type: 'string', required: false, description: 'Alt text for image. Also used to derive initials if no fallback prop.' },
      fallback: { type: 'string', required: false, description: 'Explicit initials string (first 2 chars used)' },
      size: { type: "'sm' | 'md' | 'lg' | 'xl'", required: false, description: 'Avatar size (24/32/40/48px)' },
    },
  },
  {
    name: 'Input',
    importPath: '@/components/ui/input',
    description: 'Text input field with size variants and error state.',
    variants: {
      error: ['true', 'false'],
    },
    defaultVariants: { inputSize: 'md', error: 'false' },
    sizes: ['sm', 'md', 'lg'],
    subComponents: [],
    radixPrimitive: null,
    props: {
      inputSize: { type: "'sm' | 'md' | 'lg'", required: false, description: 'Input height and text size. Named inputSize to avoid conflict with native size attribute.' },
      error: { type: 'boolean', required: false, description: 'Shows destructive border and error glow' },
    },
  },
  {
    name: 'Checkbox',
    importPath: '@/components/ui/checkbox',
    description: 'Accessible checkbox toggle with Radix primitive.',
    variants: {},
    defaultVariants: {},
    sizes: [],
    subComponents: [],
    radixPrimitive: '@radix-ui/react-checkbox',
    props: {
      checked: { type: 'boolean | "indeterminate"', required: false, description: 'Controlled checked state' },
      onCheckedChange: { type: '(checked: boolean | "indeterminate") => void', required: false, description: 'Change handler' },
      disabled: { type: 'boolean', required: false, description: 'Disables interaction' },
    },
  },
  {
    name: 'Dialog',
    importPath: '@/components/ui/dialog',
    description: 'Modal dialog with overlay, focus trapping, and escape-to-close.',
    variants: {},
    defaultVariants: {},
    sizes: [],
    subComponents: ['DialogTrigger', 'DialogContent', 'DialogHeader', 'DialogFooter', 'DialogTitle', 'DialogDescription', 'DialogClose'],
    radixPrimitive: '@radix-ui/react-dialog',
    props: {
      open: { type: 'boolean', required: false, description: 'Controlled open state' },
      onOpenChange: { type: '(open: boolean) => void', required: false, description: 'Open state change handler' },
    },
  },
  {
    name: 'Tabs',
    importPath: '@/components/ui/tabs',
    description: 'Tabbed content navigation with keyboard support.',
    variants: {},
    defaultVariants: {},
    sizes: [],
    subComponents: ['TabsList', 'TabsTrigger', 'TabsContent'],
    radixPrimitive: '@radix-ui/react-tabs',
    props: {
      defaultValue: { type: 'string', required: false, description: 'Initially active tab value' },
      value: { type: 'string', required: false, description: 'Controlled active tab value' },
      onValueChange: { type: '(value: string) => void', required: false, description: 'Tab change handler' },
    },
  },
  {
    name: 'Tooltip',
    importPath: '@/components/ui/tooltip',
    description: 'Informational popup on hover/focus with collision-aware positioning.',
    variants: {},
    defaultVariants: {},
    sizes: [],
    subComponents: ['TooltipTrigger', 'TooltipContent', 'TooltipProvider'],
    radixPrimitive: '@radix-ui/react-tooltip',
    props: {
      delayDuration: { type: 'number', required: false, description: 'Open delay in ms (default 400ms via TooltipProvider)' },
    },
  },
  {
    name: 'DropdownMenu',
    importPath: '@/components/ui/dropdown-menu',
    description: 'Contextual menu with keyboard navigation, sub-menus, checkbox/radio items.',
    variants: {},
    defaultVariants: {},
    sizes: [],
    subComponents: ['DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuCheckboxItem', 'DropdownMenuRadioItem', 'DropdownMenuLabel', 'DropdownMenuSeparator', 'DropdownMenuGroup'],
    radixPrimitive: '@radix-ui/react-dropdown-menu',
    props: {
      open: { type: 'boolean', required: false, description: 'Controlled open state' },
      onOpenChange: { type: '(open: boolean) => void', required: false, description: 'Open state change handler' },
    },
  },
  {
    name: 'Select',
    importPath: '@/components/ui/select',
    description: 'Dropdown select with typeahead, scroll-into-view, and grouped items.',
    variants: {},
    defaultVariants: {},
    sizes: [],
    subComponents: ['SelectTrigger', 'SelectContent', 'SelectItem', 'SelectValue', 'SelectGroup', 'SelectLabel'],
    radixPrimitive: '@radix-ui/react-select',
    props: {
      value: { type: 'string', required: false, description: 'Controlled selected value' },
      onValueChange: { type: '(value: string) => void', required: false, description: 'Value change handler' },
      defaultValue: { type: 'string', required: false, description: 'Initially selected value' },
    },
  },
  {
    name: 'RadioGroup',
    importPath: '@/components/ui/radio-group',
    description: 'Accessible radio button group with arrow key navigation.',
    variants: {},
    defaultVariants: {},
    sizes: [],
    subComponents: ['RadioGroupItem'],
    radixPrimitive: '@radix-ui/react-radio-group',
    props: {
      value: { type: 'string', required: false, description: 'Controlled selected value' },
      onValueChange: { type: '(value: string) => void', required: false, description: 'Value change handler' },
      defaultValue: { type: 'string', required: false, description: 'Initially selected value' },
    },
  },
];
