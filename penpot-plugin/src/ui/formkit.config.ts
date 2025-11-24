import type { DefaultConfigOptions } from '@formkit/vue';
import { defaultConfig } from '@formkit/vue';

/**
 * FormKit configuration with Penpot styling
 * Automatically applies Penpot CSS classes to all FormKit inputs
 * Based on CLAUDE.md guidelines
 */
const baseConfig = defaultConfig();

export const formkitConfig: DefaultConfigOptions = {
    ...baseConfig,
    config: {
        ...baseConfig.config,
        classes: {
            // Apply Penpot classes globally to all inputs
            outer: {
                '$reset': true,
                'form-group': true,
                'spacing-mb-1': true
            },
            wrapper: {
                '$reset': true
            },
            label: {
                '$reset': true,
                'label-spacing': true
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            input: (node: any) => {
                const type = node.props.type as string;
                const classes: Record<string, boolean> = { '$reset': true };
                
                if (type === 'text' || type === 'email' || type === 'password' || type === 'number') {
                    classes['input'] = true;
                } else if (type === 'select') {
                    classes['select'] = true;
                } else if (type === 'textarea') {
                    classes['textarea'] = true;
                }
                
                return classes;
            }
        }
    }
};
