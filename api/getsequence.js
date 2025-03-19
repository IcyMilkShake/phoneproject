// Export the getNextSequenceValue function
export async function getNextSequenceValue(sequenceName) {
    const maxUserId = await User.find().sort({ userId: -1 }).limit(1).select('userId');
    let nextId = 1;
    if (maxUserId.length > 0) {
        nextId = maxUserId[0].userId + 1;
    }
    await Counter.findOneAndUpdate(
        { modelName: sequenceName },
        { seq: nextId },
        { upsert: true }
    );
    return nextId;
}
