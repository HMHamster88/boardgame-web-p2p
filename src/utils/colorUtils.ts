interface RGBAColor {
    r: number,
    g: number,
    b: number,
    a?: number
}

interface HLSAColor {
    h: number,
    l: number,
    s: number,
    a?: number
}

export function parseColor(input: String): RGBAColor | undefined {
    const matches = input.match(/^#?([a-fA-F0-9]{8}|[a-fA-F0-9]{6})$/)
    if (!matches) {
        return undefined
    }
    const m = matches[1];
    if (m) {

        return {
            r: parseInt(m.substring(0, 2), 16),
            g: parseInt(m.substring(2, 4), 16),
            b: parseInt(m.substring(4, 6), 16),
            a: m.length == 6 ? undefined : parseInt(m.substring(6, 8), 16),
        };
    }
}


export function rgbToHsl(color: RGBAColor): HLSAColor {
    const r = color.r / 255;
    const g = color.g / 255;
    const b = color.b / 255;

    // Find greatest and smallest channel values
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

    // Calculate hue
    // No difference
    if (delta === 0)
        h = 0;
    // Red is max
    else if (cmax === r)
        h = ((g - b) / delta) % 6;
    // Green is max
    else if (cmax === g)
        h = (b - r) / delta + 2;
    // Blue is max
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    // Make negative hues positive behind 360°
    if (h < 0)
        h += 360;

    // Calculate lightness
    l = (cmax + cmin) / 2;

    // Calculate saturation
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return {
        h: h!,
        l: l!,
        s: s!,
        a: color.a
    }
}