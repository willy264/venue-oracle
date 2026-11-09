module venue_oracle::commit {
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::tx_context::{Self, TxContext};

    public struct Committed has copy, drop {
        digest: vector<u8>,
        reference: vector<u8>,
        sender: address,
        ts_ms: u64,
    }

    public entry fun commit(
        digest: vector<u8>,
        reference: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        event::emit(Committed {
            digest,
            reference,
            sender: tx_context::sender(ctx),
            ts_ms: clock::timestamp_ms(clock),
        });
    }
}
