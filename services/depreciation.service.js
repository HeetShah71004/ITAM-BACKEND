/**
 * @desc    Depreciation Calculation Service
 */

/**
 * Calculates depreciation using the Straight-Line method.
 * 
 * Formula:
 * annualDepreciation = (purchaseCost - salvageValue) / usefulLife
 * yearsUsed = floor((today - purchaseDate) / 365.25 days)
 * currentValue = purchaseCost - (annualDepreciation * yearsUsed)
 * 
 * @param {Object} asset - The asset object containing purchaseCost, salvageValue, usefulLife, and purchaseDate.
 * @returns {Object} - Depreciation details: { annualDepreciation, yearsUsed, currentValue, isFullyDepreciated }
 * @throws {Error} - If required fields are missing or invalid.
 */
export const calculateStraightLineDepreciation = (asset) => {
    const { purchaseCost, salvageValue = 0, usefulLife, purchaseDate } = asset;

    // Validation
    if (purchaseCost === undefined || purchaseCost === null) {
        throw new Error("Purchase cost is required for depreciation calculation.");
    }
    if (!purchaseDate) {
        throw new Error("Purchase date is required for depreciation calculation.");
    }
    if (!usefulLife || usefulLife < 1) {
        throw new Error("Useful life must be at least 1 year.");
    }
    if (salvageValue >= purchaseCost) {
        throw new Error("Salvage value must be less than purchase cost.");
    }

    const today = new Date();
    const pDate = new Date(purchaseDate);

    // Calculate annual depreciation
    const annualDepreciation = Number(((purchaseCost - salvageValue) / usefulLife).toFixed(2));

    // Calculate years used
    const diffInMs = today - pDate;
    const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
    let yearsUsed = Math.floor(diffInMs / msPerYear);
    
    // Ensure yearsUsed is not negative (if purchase date is today)
    if (yearsUsed < 0) yearsUsed = 0;
    
    // Cap yearsUsed by usefulLife
    if (yearsUsed > usefulLife) yearsUsed = usefulLife;

    // Calculate current value
    let currentValue = Number((purchaseCost - (annualDepreciation * yearsUsed)).toFixed(2));

    // Edge Handling: currentValue < salvageValue
    if (currentValue < salvageValue) {
        currentValue = salvageValue;
    }

    const isFullyDepreciated = currentValue === salvageValue;

    return {
        annualDepreciation,
        yearsUsed,
        currentValue,
        isFullyDepreciated
    };
};
