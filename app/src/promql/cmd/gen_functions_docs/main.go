package main

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"sort"
	"strings"

	"github.com/russross/blackfriday/v2"
)

var funcDocsRe = regexp.MustCompile("^## `(.+)\\(\\)`\n$|^## (Trigonometric Functions)\n$")

func main() {
	resp, err := http.Get("https://raw.githubusercontent.com/prometheus/prometheus/master/docs/querying/functions.md")
	if err != nil {
		log.Fatalln("Failed to fetch function docs:", err)
	}
	if resp.StatusCode != 200 {
		log.Fatalln("Bad status code while fetching function docs:", resp.Status)
	}

	funcDocs := map[string]string{}

	r := bufio.NewReader(resp.Body)
	currentFunc := ""
	currentDocs := ""

	saveCurrent := func() {
		switch currentFunc {
		case "<aggregation>_over_time":
			for _, fn := range []string{
				"avg_over_time",
				"min_over_time",
				"max_over_time",
				"sum_over_time",
				"count_over_time",
				"quantile_over_time",
				"stddev_over_time",
				"stdvar_over_time",
				"last_over_time",
				"present_over_time",
			} {
				funcDocs[fn] = currentDocs
			}
		case "Trigonometric Functions":
			for _, fn := range []string{
				"acos",
				"acosh",
				"asin",
				"asinh",
				"atan",
				"atanh",
				"cos",
				"cosh",
				"sin",
				"sinh",
				"tan",
				"tanh",
				"deg",
				"pi",
				"rad",
			} {
				funcDocs[fn] = currentDocs
			}
		default:
			funcDocs[currentFunc] = currentDocs
		}
	}

	for {
		line, err := r.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				saveCurrent()
				break
			}
			log.Fatalln("Error reading response body:", err)
		}

		matches := funcDocsRe.FindStringSubmatch(line)
		if len(matches) > 0 {
			if currentFunc != "" {
				saveCurrent()
			}
			currentDocs = ""

			currentFunc = string(matches[1])
			if matches[2] != "" {
				// This is the case for "## Trigonometric Functions"
				currentFunc = matches[2]
			}
		} else {
			currentDocs += line
		}
	}

	fmt.Println("import React from 'react';")
	fmt.Println("")
	fmt.Println("const funcDocs: Record<string, React.ReactNode> = {")

	funcNames := make([]string, 0, len(funcDocs))
	for k, _ := range funcDocs {
		funcNames = append(funcNames, k)
	}
	sort.Strings(funcNames)
	for _, fn := range funcNames {
		// Translate:
		//   {   ===>   {'{'}
		//   }   ===>   {'}'}
		//
		// TODO: Make this set of conflicting string replacements less hacky.
		jsxEscapedDocs := strings.ReplaceAll(funcDocs[fn], "{", `__LEFT_BRACE__'{'__RIGHT_BRACE__`)
		jsxEscapedDocs = strings.ReplaceAll(jsxEscapedDocs, "}", `__LEFT_BRACE__'}'__RIGHT_BRACE__`)
		jsxEscapedDocs = strings.ReplaceAll(jsxEscapedDocs, "__LEFT_BRACE__", "{")
		jsxEscapedDocs = strings.ReplaceAll(jsxEscapedDocs, "__RIGHT_BRACE__", "}")
		fmt.Printf("  '%s': <>%s</>,\n", fn, string(blackfriday.Run([]byte(jsxEscapedDocs))))
	}
	fmt.Println("};")
	fmt.Println("")
	fmt.Println("export default funcDocs;")
}
