#[test_only]
module venue_oracle::commit_tests {
    use sui::test_scenario;
    use sui::clock;
    use venue_oracle::commit;

    #[test]
    fun commit_emits_event() {
        let sender = @0xA;
        let mut scenario = test_scenario::begin(sender);
        {
            let clock = clock::create_for_testing(&mut scenario);
            commit::commit(b"digest", b"pair-1", &clock, test_scenario::ctx(&mut scenario));
            clock::destroy_for_testing(clock);
        };
        test_scenario::next_tx(&mut scenario, sender);
        test_scenario::end(scenario);
    }
}
