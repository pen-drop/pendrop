import Handlebars from 'handlebars';
import { resolver } from './resolver.js';

// Register standard helpers
Handlebars.registerHelper('json', (context) => JSON.stringify(context, null, 2));
Handlebars.registerHelper('eq', (a, b) => a === b);

export class TemplateEngine {
  /**
   * Expand variables recursively (resolving {{var}} references within values)
   */
  async expandVariables(variables: Record<string, any>): Promise<Record<string, any>> {
    const result = { ...variables };
    const hbs = Handlebars.create();
    
    // Use a simple synchronous render for variable expansion
    // Limit passes to prevent infinite loops
    for (let pass = 0; pass < 3; pass++) {
        let changed = false;
        for (const [key, value] of Object.entries(result)) {
            if (typeof value === 'string' && value.includes('{{')) {
                try {
                    const template = hbs.compile(value, { noEscape: true });
                    const newValue = template(result);
                    if (newValue !== value) {
                        result[key] = newValue;
                        changed = true;
                    }
                } catch (e) {
                    // Ignore errors, keep original value
                }
            }
        }
        if (!changed) break;
    }
    
    return result;
  }

  async render(templateStr: string, context: Record<string, any>, contextPath: string): Promise<string> {
    const pendingResolutions: Map<string, Promise<string>> = new Map();
    
    const hbs = Handlebars.create();

    // Register standard helpers
    hbs.registerHelper('json', (ctx) => new Handlebars.SafeString(JSON.stringify(ctx, null, 2)));
    hbs.registerHelper('eq', (a, b) => a === b);

    // Register async helpers
    hbs.registerHelper('resolve', function(target) {
        const options = arguments[arguments.length - 1];
        const currentPath = options.data?.contextPath || contextPath;

        const id = `__PENDING_RESOLVE_${Math.random().toString(36).substr(2, 9)}__`;
        
        const promise = (async () => {
            try {
                const res = await resolver.resolve(target, currentPath);
                return res.path;
            } catch (e) {
                return `[Error resolving ${target}: ${e}]`;
            }
        })();
        
        pendingResolutions.set(id, promise);
        return id;
    });

    hbs.registerHelper('read', function(target) {
        const options = arguments[arguments.length - 1];
        const currentPath = options.data?.contextPath || contextPath;

        const id = `__PENDING_READ_${Math.random().toString(36).substr(2, 9)}__`;
        
        const promise = (async () => {
            try {
                const res = await resolver.resolve(target, currentPath);
                return res.content;
            } catch (e) {
                return `[Error reading ${target}: ${e}]`;
            }
        })();
        
        pendingResolutions.set(id, promise);
        return id;
    });

    // Initial render
    const template = hbs.compile(templateStr);
    let result = template(context, {
        data: {
            contextPath: contextPath
        }
    });

    // Resolve all pending promises
    if (pendingResolutions.size > 0) {
        const ids = Array.from(pendingResolutions.keys());
        const values = await Promise.all(pendingResolutions.values());
        
        // Replace all IDs
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const val = values[i];
            // Global replace
            result = result.split(id).join(val);
        }
    }

    return result;
  }
}

export const templateEngine = new TemplateEngine();
