// src/components/admin/select-kit.tsx
'use client'

import * as React from 'react'

import { ThemedSelect, type ThemedSelectOption } from '@/components/ui/ThemedSelect'
import { cn } from '@/lib/utils'

/**
 * The admin's <Select> and <FieldSelect>, drawn with ThemedSelect so the open
 * list is in the site's colours rather than the operating system's blue.
 *
 * They keep the native select's API — <option>/<optgroup> children, `value`
 * or `defaultValue`, `onChange(event)` reading `event.target.value`, `name`,
 * `required` — so the forms that use them are unchanged. A disabled option with
 * an empty value (the "Select a city" prompt) becomes the placeholder.
 */

type NativeSelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'defaultValue'> & {
  value?: string | number
  defaultValue?: string | number
}

const textOf = (node: React.ReactNode): string =>
  React.Children.toArray(node)
    .map((child) => (typeof child === 'string' || typeof child === 'number' ? String(child) : ''))
    .join('')

/** Flattens <option> / <optgroup> children (through fragments and arrays). */
function readOptions(children: React.ReactNode, group?: string, out: ThemedSelectOption[] = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const props = child.props as { value?: string | number; label?: string; disabled?: boolean; children?: React.ReactNode }
    if (child.type === React.Fragment) readOptions(props.children, group, out)
    else if (child.type === 'optgroup') readOptions(props.children, props.label, out)
    else if (child.type === 'option') {
      const text = textOf(props.children)
      out.push({ value: String(props.value ?? text), label: text, disabled: props.disabled, group })
    }
  })
  return out
}

function NativeLike({
  value: controlled,
  defaultValue,
  onChange,
  children,
  name,
  id,
  required,
  disabled,
  className,
  wrapperClassName,
  ...rest
}: NativeSelectProps & { wrapperClassName?: string }) {
  const all = readOptions(children)
  const prompt = all.find((o) => o.value === '' && o.disabled)
  const options = all.filter((o) => o !== prompt)
  const [own, setOwn] = React.useState(() =>
    defaultValue !== undefined ? String(defaultValue) : (all.find((o) => !o.disabled)?.value ?? all[0]?.value ?? ''),
  )
  const value = controlled !== undefined ? String(controlled) : own
  const wrapRef = React.useRef<HTMLSpanElement>(null)

  const change = (next: string) => {
    if (controlled === undefined) setOwn(next)
    const target = { value: next, name: name ?? '', id: id ?? '' }
    onChange?.({ target, currentTarget: target } as unknown as React.ChangeEvent<HTMLSelectElement>)
    // A native select's change bubbles to its form; useUnsavedChanges listens for it.
    wrapRef.current?.dispatchEvent(new Event('change', { bubbles: true }))
  }

  return (
    <span ref={wrapRef} className={cn('relative', wrapperClassName)}>
      <ThemedSelect
        id={id}
        name={required ? undefined : name}
        value={value}
        onChange={change}
        options={options}
        placeholder={prompt ? String(prompt.label) : undefined}
        disabled={disabled}
        aria-label={rest['aria-label']}
        className={className}
        wrapperClassName="w-full"
      />
      {/* Required: an invisible text input carries the value so the browser
          still refuses to submit the form while nothing is chosen. */}
      {required ? (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          name={name}
          value={value}
          onChange={() => undefined}
          onFocus={() => wrapRef.current?.querySelector('button')?.focus()}
          className="pointer-events-none absolute bottom-0 left-4 h-px w-px opacity-0"
        />
      ) : null}
    </span>
  )
}

/** .selw: the filter-bar select (48px, 14px corners). */
export function Select({ className, wrapClassName, ...rest }: NativeSelectProps & { wrapClassName?: string }) {
  return (
    <NativeLike
      {...rest}
      className={cn('h-12 rounded-[14px] border border-ink/[.09] bg-paper pl-3.5', className)}
      wrapperClassName={cn('inline-flex items-center', wrapClassName)}
    />
  )
}

/** A form select in the shape of .in (52px, 14px corners). */
export function FieldSelect({ className, ...rest }: NativeSelectProps) {
  return (
    <NativeLike
      {...rest}
      className={cn('h-[52px] rounded-[14px] border-ink/[.09] px-4 text-base font-normal', className)}
      wrapperClassName="block"
    />
  )
}
