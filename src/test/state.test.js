import StateToMarkdown from "@/packages/modules/state/stateToMarkdown";

describe("State module", () => {
    test("State to markdown test", () => {
        const stateToMarkdown = new StateToMarkdown();
        const markdown = stateToMarkdown.generate([
            {
                id: "",
                type: "paragraph",
                text: "xxxx",
            },
        ]);
        expect(markdown).toBe(markdown);
    });
});
