package main

import (
	"fmt"
	"sort"
	"strings"

	"github.com/prometheus/prometheus/promql/parser"
)

func formatValueType(vt parser.ValueType) string {
	return "valueType." + string(vt)
}

func formatValueTypes(vts []parser.ValueType) string {
	fmtVts := make([]string, 0, len(vts))
	for _, vt := range vts {
		fmtVts = append(fmtVts, formatValueType(vt))
	}
	return strings.Join(fmtVts, ", ")
}

func main() {
	fnNames := make([]string, 0, len(parser.Functions))
	for name := range parser.Functions {
		fnNames = append(fnNames, name)
	}
	sort.Strings(fnNames)
	fmt.Println(`import { valueType, Func } from './ast';

	export const functionSignatures: Record<string, Func> = {`)
	for _, fnName := range fnNames {
		fn := parser.Functions[fnName]
		fmt.Printf("  %s: { name: '%s', argTypes: [%s], variadic: %d, returnType: %s },\n", fn.Name, fn.Name, formatValueTypes(fn.ArgTypes), fn.Variadic, formatValueType(fn.ReturnType))
	}
	fmt.Println("}")
}
