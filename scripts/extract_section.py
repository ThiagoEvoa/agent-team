#!/usr/bin/env python3
import sys
import os
import re

def get_headings(lines):
    """
    Parses lines of markdown and returns a list of dictionaries with:
    - line_idx: 0-based line index
    - level: 1, 2, 3, etc. (number of '#'s)
    - text: raw text of heading
    - clean_text: text without leading/trailing spaces, '#', or markdown formatting (links, backticks)
    """
    headings = []
    for idx, line in enumerate(lines):
        # Match markdown heading (e.g., # Hello, ## World)
        match = re.match(r'^(#{1,6})\s+(.+)$', line.strip())
        if match:
            level = len(match.group(1))
            text = match.group(2).strip()
            # Clean text from backticks, markdown links, etc.
            # e.g., "[pubspec.yaml](file:///...)" -> "pubspec.yaml"
            clean = text
            # Strip markdown links: [label](url) -> label
            clean = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', clean)
            # Strip backticks
            clean = clean.replace('`', '')
            headings.append({
                'line_idx': idx,
                'level': level,
                'text': text,
                'clean_text': clean.strip()
            })
    return headings

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 extract_section.py <file_path> <heading_query>", file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    query = sys.argv[2].strip().lower()

    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' does not exist.", file=sys.stderr)
        sys.exit(1)

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.splitlines()
    headings = get_headings(lines)

    if not headings:
        print("No headings found in the markdown file. Printing full file:", file=sys.stderr)
        print(content)
        sys.exit(0)

    # Try to find a match
    matched_heading = None
    matches = []

    # First attempt: Exact match on clean text (case-insensitive)
    for h in headings:
        if h['clean_text'].lower() == query:
            matches.append(h)
    
    # Second attempt: Substring match if no exact match
    if not matches:
        for h in headings:
            if query in h['clean_text'].lower() or query in h['text'].lower():
                matches.append(h)

    # If still no matches, try matching without numbers/prefixes (e.g. "3.1 pubspec.yaml" matched by "pubspec.yaml")
    if not matches:
        for h in headings:
            # Strip leading section numbers like "3.1 ", "1. ", "### " from clean text
            normalized = re.sub(r'^[0-9\.]+\s+', '', h['clean_text'].lower())
            if query in normalized:
                matches.append(h)

    if not matches:
        print(f"Error: Heading matching '{sys.argv[2]}' not found.", file=sys.stderr)
        print("\nAvailable headings in the file:", file=sys.stderr)
        for h in headings:
            print(f"  {'  ' * (h['level'] - 1)}- {h['clean_text']}  (level {h['level']})", file=sys.stderr)
        sys.exit(1)

    if len(matches) > 1:
        # If one is an exact match (or we have multiple), check if we can disambiguate
        # Filter for the shortest heading or the one that starts with the query
        exact_matches = [m for m in matches if m['clean_text'].lower() == query]
        if len(exact_matches) == 1:
            matched_heading = exact_matches[0]
        else:
            print(f"Warning: Multiple headings matched '{sys.argv[2]}':", file=sys.stderr)
            for m in matches:
                print(f"  - {m['clean_text']}", file=sys.stderr)
            # Default to the first match but warn
            matched_heading = matches[0]
            print(f"Selecting the first match: '{matched_heading['clean_text']}'", file=sys.stderr)
    else:
        matched_heading = matches[0]

    # Find the end of the section
    start_idx = matched_heading['line_idx']
    level = matched_heading['level']
    
    # End index is the line index of the next heading of equal or higher level (i.e. level <= matched level)
    end_idx = len(lines)
    for h in headings:
        if h['line_idx'] > start_idx and h['level'] <= level:
            end_idx = h['line_idx']
            break

    # Print the section
    section_lines = lines[start_idx:end_idx]
    
    # Clean up trailing empty lines
    while section_lines and not section_lines[-1].strip():
        section_lines.pop()

    print('\n'.join(section_lines))

if __name__ == '__main__':
    main()
