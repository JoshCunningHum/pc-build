import type { Builds } from "./build";

export interface RuleProps<TParts extends Builds.PartType> {
    build: Partial<Builds.BuildParts> & Pick<Required<Builds.BuildParts>, TParts>
    issue: (severity: Issue['severity'], code: string, message: string,) => Builds.BuildIssue
}

export interface RuleItem<TParts extends Builds.PartType> {
    parts: TParts[] // List all the required parts needed for this rule
    rule: (params: RuleProps<TParts>) => Builds.BuildIssue | void
}
