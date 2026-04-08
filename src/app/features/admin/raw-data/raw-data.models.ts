export type FieldType = 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'email' | 'password' | 'select' | 'textarea';

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: any; label: string }[];
  required?: boolean;
  createOnly?: boolean; // show only on create form
}

export interface ModelConfig {
  label: string;
  singularLabel: string;
  endpoint: string;
  searchPlaceholder: string;
  displayColumns: string[];
  fields: FieldConfig[];
  noCreate?: boolean;
  noEdit?: boolean;
}

export const RAW_MODELS: Record<string, ModelConfig> = {
  users: {
    label: 'Users',
    singularLabel: 'User',
    endpoint: 'users',
    searchPlaceholder: 'Search by name or email...',
    displayColumns: ['id', 'name', 'surname', 'email', 'role', 'status', 'plan', 'created_at'],
    fields: [
      { key: 'name',     label: 'First Name', type: 'text',     required: true },
      { key: 'surname',  label: 'Last Name',  type: 'text',     required: true },
      { key: 'email',    label: 'Email',      type: 'email',    required: true },
      { key: 'password', label: 'Password',   type: 'password', required: true, createOnly: true },
      { key: 'role',     label: 'Role',       type: 'select',   options: [{ value: 'user', label: 'User' }] },
      { key: 'status',   label: 'Status',     type: 'select',   options: [
        { value: 'active',    label: 'Active' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'banned',    label: 'Banned' },
      ]},
      { key: 'plan', label: 'Plan', type: 'select', options: [
        { value: 'free',       label: 'Free' },
        { value: 'pro',        label: 'Pro' },
        { value: 'enterprise', label: 'Enterprise' },
      ]},
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'unit',    label: 'Unit',    type: 'select', options: [
        { value: 'kg', label: 'kg' },
        { value: 'lb', label: 'lb' },
      ]},
    ],
  },

  employees: {
    label: 'Employees',
    singularLabel: 'Employee',
    endpoint: 'employees',
    searchPlaceholder: 'Search by name or email...',
    displayColumns: ['id', 'name', 'surname', 'email', 'role', 'created_at'],
    fields: [
      { key: 'name',     label: 'First Name', type: 'text',     required: true },
      { key: 'surname',  label: 'Last Name',  type: 'text',     required: true },
      { key: 'email',    label: 'Email',      type: 'email',    required: true },
      { key: 'password', label: 'Password',   type: 'password', required: true, createOnly: true },
      { key: 'role',     label: 'Role',       type: 'select',   required: true, options: [
        { value: 'support',    label: 'Support' },
        { value: 'moderator',  label: 'Moderator' },
        { value: 'admin',      label: 'Admin' },
        { value: 'superadmin', label: 'Superadmin' },
      ]},
    ],
  },

  apiaries: {
    label: 'Apiaries',
    singularLabel: 'Apiary',
    endpoint: 'apiaries',
    searchPlaceholder: 'Search by name...',
    displayColumns: ['id', 'name', 'latitude', 'longitude', 'user_id', 'created_at'],
    fields: [
      { key: 'name',      label: 'Name',      type: 'text',   required: true },
      { key: 'latitude',  label: 'Latitude',  type: 'number' },
      { key: 'longitude', label: 'Longitude', type: 'number' },
      { key: 'user_id',   label: 'User ID',   type: 'number', required: true },
    ],
  },

  beehives: {
    label: 'Beehives',
    singularLabel: 'Beehive',
    endpoint: 'beehives',
    searchPlaceholder: 'Search by number...',
    displayColumns: ['id', 'number', 'apiary_id', 'queen_id', 'created_at'],
    fields: [
      { key: 'number',    label: 'Number',    type: 'number', required: true },
      { key: 'apiary_id', label: 'Apiary ID', type: 'number', required: true },
      { key: 'queen_id',  label: 'Queen ID',  type: 'number' },
    ],
  },

  queens: {
    label: 'Queens',
    singularLabel: 'Queen',
    endpoint: 'queens',
    searchPlaceholder: 'Search by year...',
    displayColumns: ['id', 'year', 'created_at'],
    fields: [
      { key: 'year', label: 'Year', type: 'number', required: true },
    ],
  },

  'beehive-groups': {
    label: 'Beehive Groups',
    singularLabel: 'Beehive Group',
    endpoint: 'beehive-groups',
    searchPlaceholder: 'Search by name...',
    displayColumns: ['id', 'name', 'user_id', 'created_at'],
    fields: [
      { key: 'name',    label: 'Name',    type: 'text',   required: true },
      { key: 'user_id', label: 'User ID', type: 'number', required: true },
    ],
  },

  records: {
    label: 'Records',
    singularLabel: 'Record',
    endpoint: 'records',
    searchPlaceholder: 'Search by type...',
    displayColumns: ['id', 'type', 'date', 'beehive_id', 'created_at'],
    fields: [
      { key: 'beehive_id', label: 'Beehive ID', type: 'number', required: true },
      { key: 'date',       label: 'Date',        type: 'date',   required: true },
      { key: 'type',       label: 'Type',        type: 'select', required: true, options: [
        { value: 'inspection', label: 'Inspection' },
        { value: 'feeding',    label: 'Feeding' },
        { value: 'harvest',    label: 'Harvest' },
      ]},
      { key: 'population',   label: 'Population',    type: 'number' },
      { key: 'frame_space',  label: 'Frame Space',   type: 'number' },
      { key: 'queen_exists', label: 'Queen Exists',  type: 'boolean' },
      { key: 'queen_year',   label: 'Queen Year',    type: 'number' },
      { key: 'varroa',       label: 'Varroa',        type: 'boolean' },
      { key: 'food_type',    label: 'Food Type',     type: 'text' },
      { key: 'food_quantity',label: 'Food Quantity', type: 'number' },
      { key: 'honey_type',   label: 'Honey Type',    type: 'text' },
      { key: 'unit',         label: 'Unit',          type: 'text' },
    ],
  },

  costs: {
    label: 'Costs',
    singularLabel: 'Cost',
    endpoint: 'costs',
    searchPlaceholder: 'Search by name...',
    displayColumns: ['id', 'name', 'amount', 'date', 'cost_category_id', 'created_at'],
    fields: [
      { key: 'name',             label: 'Name',        type: 'text',   required: true },
      { key: 'amount',           label: 'Amount',      type: 'number', required: true },
      { key: 'date',             label: 'Date',        type: 'date',   required: true },
      { key: 'cost_category_id', label: 'Category ID', type: 'number', required: true },
    ],
  },

  'cost-categories': {
    label: 'Cost Categories',
    singularLabel: 'Cost Category',
    endpoint: 'cost-categories',
    searchPlaceholder: 'Search by name...',
    displayColumns: ['id', 'name', 'type', 'user_id', 'created_at'],
    fields: [
      { key: 'name',        label: 'Name',        type: 'text',   required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'type',        label: 'Type',        type: 'select', required: true, options: [
        { value: 'income',  label: 'Income' },
        { value: 'outcome', label: 'Outcome' },
      ]},
      { key: 'user_id', label: 'User ID', type: 'number', required: true },
    ],
  },

  coupons: {
    label: 'Coupons',
    singularLabel: 'Coupon',
    endpoint: 'coupons',
    searchPlaceholder: 'Search by code...',
    displayColumns: ['id', 'code', 'type', 'value', 'used_count', 'is_active', 'expires_at'],
    fields: [
      { key: 'code',       label: 'Code',       type: 'text',   required: true },
      { key: 'type',       label: 'Type',       type: 'select', required: true, options: [
        { value: 'percentage',  label: '% Discount' },
        { value: 'free_period', label: 'Free Period' },
      ]},
      { key: 'value',      label: 'Value',      type: 'number', required: true },
      { key: 'value_unit', label: 'Value Unit', type: 'select', options: [
        { value: 'days',   label: 'Days' },
        { value: 'months', label: 'Months' },
      ]},
      { key: 'max_uses',   label: 'Max Uses',   type: 'number' },
      { key: 'expires_at', label: 'Expires At', type: 'datetime' },
      { key: 'is_active',  label: 'Active',     type: 'boolean' },
    ],
  },

  tokens: {
    label: 'OAuth Tokens',
    singularLabel: 'Token',
    endpoint: 'tokens/list',
    searchPlaceholder: 'Search by user email...',
    displayColumns: ['id', 'user_email', 'user_name', 'name', 'scopes', 'created_at', 'expires_at'],
    fields: [],
    noCreate: true,
    noEdit: true,
  },
};
