/* eslint-disable react/prop-types */
import React from 'react'
import NextLink from 'next/link'
import {useService, useMachine} from '@xstate/react'
import {
  Flex,
  Box,
  Alert,
  AlertIcon,
  Image,
  MenuDivider,
  useTheme,
  useToast,
  Drawer,
  DrawerHeader,
  DrawerBody,
  DrawerContent,
  Input,
  DrawerCloseButton,
  DrawerOverlay,
  useDisclosure,
  Icon,
  Heading,
  Text,
  FormControl,
  FormLabel,
} from '@chakra-ui/core'
import {transparentize, rem} from 'polished'
import dayjs from 'dayjs'
import {useTranslation} from 'react-i18next'
import {Page, PageTitle} from '../../screens/app/components'
import {
  FlipCardImage,
  FlipCardTitle,
  FlipCardSubtitle,
  FlipFilter,
  FlipFilterOption,
  RequiredFlipPlaceholder,
  OptionalFlipPlaceholder,
  FlipCardList,
  FlipCardMenu,
  FlipCardMenuItem,
  FlipCardMenuItemIcon,
  EmptyFlipBox,
  FlipOverlay,
  FlipOverlayStatus,
  FlipOverlayIcon,
  FlipOverlayText,
  FlipCardImageBox,
  FlipImage,
} from '../../screens/flips/components'
import {formatKeywords} from '../../screens/flips/utils'
import {IconLink} from '../../shared/components/link'
import {FlipType} from '../../shared/types'
import {Debug} from '../../shared/components/components'
import {flipsMachine} from '../../screens/flips/machines'
import {useIdentityState} from '../../shared/providers/identity-context'
import Layout from '../../shared/components/layout'
import {useChainState} from '../../shared/providers/chain-context'
import {Notification} from '../../shared/components/notifications'
import {NotificationType} from '../../shared/providers/notification-context'
import {PrimaryButton} from '../../shared/components/button'

export default function FlipListPage() {
  const {t} = useTranslation()

  const toast = useToast()

  const {
    isOpen: isOpenDeleteForm,
    onOpen: openDeleteForm,
    onClose: onCloseDeleteForm,
  } = useDisclosure()

  const {syncing, offline, loading} = useChainState()

  const {
    flips: knownFlips,
    requiredFlips: requiredFlipsNumber,
    availableFlips: availableFlipsNumber,
    flipKeyWordPairs: availableKeywords,
  } = useIdentityState()

  const [selectedFlip, setSelectedFlip] = React.useState()

  const [current, send] = useMachine(flipsMachine, {
    context: {
      knownFlips: knownFlips || [],
      availableKeywords: availableKeywords || [],
    },
    actions: {
      onError: (_, {error}) =>
        toast({
          title: error,
          status: 'error',
          duration: 5000,
          isClosable: true,
          // eslint-disable-next-line react/display-name
          render: () => (
            <Box fontSize="md">
              <Notification title={error} type={NotificationType.Error} />
            </Box>
          ),
        }),
    },
  })
  const {flips, missingFlips} = current.context

  const readyState = state => ({ready: {dirty: state}})

  // eslint-disable-next-line no-nested-ternary
  const filteredFlips = current.matches(readyState('active'))
    ? flips.filter(({type}) =>
        [
          FlipType.Publishing,
          FlipType.Published,
          FlipType.Deleting,
          FlipType.Invalid,
        ].includes(type)
      )
    : // eslint-disable-next-line no-nested-ternary
    current.matches(readyState('drafts'))
    ? flips.filter(({type}) => [FlipType.Draft].includes(type))
    : current.matches(readyState('archive'))
    ? flips.filter(({type}) =>
        [FlipType.Archived, FlipType.Deleted].includes(type)
      )
    : []

  const madeFlipsNumber = (knownFlips || []).length

  const remainingRequiredFlips = requiredFlipsNumber - madeFlipsNumber
  const remainingOptionalFlips =
    availableFlipsNumber - Math.max(requiredFlipsNumber, madeFlipsNumber)

  return (
    <Layout syncing={syncing} offline={offline} loading={loading}>
      <Page>
        <PageTitle>{t('My Flips')}</PageTitle>
        <Flex justify="space-between" align="center" alignSelf="stretch" mb={8}>
          <FlipFilter
            defaultValue="Active"
            onChange={value => send(`FILTER_${value.toUpperCase()}`)}
          >
            <FlipFilterOption value="Active">{t('Active')}</FlipFilterOption>
            <FlipFilterOption value="Drafts">{t('Drafts')}</FlipFilterOption>
            <FlipFilterOption value="Archive">{t('Archived')}</FlipFilterOption>
          </FlipFilter>
          <IconLink href="/flips/new" icon="plus-solid">
            {t('Add flip')}
          </IconLink>
        </Flex>
        {current.matches('ready.dirty.active') &&
          (remainingRequiredFlips > 0 || remainingOptionalFlips > 0) && (
            <Box alignSelf="stretch" mb={8}>
              <Alert
                status="success"
                bg="green.010"
                borderWidth="1px"
                borderColor="green.050"
                fontWeight={500}
                rounded="md"
                px={3}
                py={2}
              >
                <AlertIcon
                  name="info"
                  color="green.500"
                  size={5}
                  mr={3}
                ></AlertIcon>
                {remainingRequiredFlips
                  ? t(`Please submit required flips.`, {remainingRequiredFlips})
                  : null}{' '}
                {remainingOptionalFlips
                  ? t(`You can also submit optional flips if you want.`, {
                      remainingOptionalFlips,
                    })
                  : null}
              </Alert>
            </Box>
          )}

        {current.matches('ready.pristine') && (
          <Flex
            flex={1}
            alignItems="center"
            justifyContent="center"
            alignSelf="stretch"
          >
            <Image src="/static/flips-cant-icn.svg" />
          </Flex>
        )}

        {current.matches('ready.dirty') && (
          <FlipCardList>
            {filteredFlips.map(flip => (
              <FlipCard
                key={flip.id}
                flipService={flip.ref}
                onDelete={() => {
                  if (
                    flip.type === FlipType.Published &&
                    (knownFlips || []).includes(flip.hash)
                  ) {
                    setSelectedFlip(flip)
                    openDeleteForm()
                  }
                  if (flip.type === FlipType.Draft) flip.ref.send('ARCHIVE')
                  if (flip.type === FlipType.Archived) flip.ref.send('REMOVE')
                }}
              />
            ))}
            {current.matches('ready.dirty.active') && (
              <>
                {missingFlips.map(({keywords}, idx) => (
                  <Box key={idx}>
                    <EmptyFlipBox>
                      <Image src="/static/flips-cant-icn.svg" />
                    </EmptyFlipBox>
                    <Box mt={4}>
                      <FlipCardTitle>
                        {keywords
                          ? formatKeywords(keywords.words)
                          : t('Missing keywords')}
                      </FlipCardTitle>
                      <FlipCardSubtitle>
                        {t('Missing on client')}
                      </FlipCardSubtitle>
                    </Box>
                  </Box>
                ))}
                {Array.from({length: remainingRequiredFlips}, (flip, idx) => (
                  <RequiredFlipPlaceholder
                    key={idx}
                    title={`Flip #${idx + 1}`}
                    {...flip}
                  />
                ))}
                {Array.from({length: remainingOptionalFlips}, (flip, idx) => (
                  <OptionalFlipPlaceholder
                    key={idx}
                    title={`Flip #${remainingRequiredFlips + idx}`}
                    {...flip}
                  />
                ))}
              </>
            )}
          </FlipCardList>
        )}

        <Drawer isOpen={isOpenDeleteForm} onClose={onCloseDeleteForm}>
          <DrawerOverlay bg="xblack.080" />
          <DrawerContent px={8} py={10} w={rem(360)}>
            <DrawerCloseButton />
            <DrawerHeader p={0} mb={3}>
              <Flex
                align="center"
                justify="center"
                bg="red.012"
                h={12}
                w={12}
                rounded="xl"
              >
                <Icon name="delete" size={6} color="red.500" />
              </Flex>
              <Heading
                fontSize="lg"
                fontWeight={500}
                color="brandGray.500"
                mt={4}
              >
                {t('Delete flip')}
              </Heading>
            </DrawerHeader>
            <DrawerBody p={0}>
              <Text color="brandGray.500" fontSize="md">
                {t('Deleted flip will be moved to the drafts.')}
              </Text>
              {selectedFlip && (
                <>
                  <FlipImage
                    src={selectedFlip.images[selectedFlip.originalOrder[0]]}
                    size={160}
                    objectFit="cover"
                    mx="auto"
                    mt={8}
                    mb={38}
                    rounded="lg"
                  />
                  <FormControl mb={6}>
                    <FormLabel
                      htmlFor="hashInput"
                      color="brandGray.500"
                      fontSize="md"
                      fontWeight={500}
                      mb={2}
                    >
                      {t('Flip hash')}
                    </FormLabel>
                    <Input
                      id="hashInput"
                      h={8}
                      borderColor="gray.300"
                      lineHeight={rem(18)}
                      px={3}
                      pt="3/2"
                      pb={2}
                      mb={2}
                      value={selectedFlip.hash}
                      isReadOnly
                      _readOnly={{
                        bg: 'gray.50',
                        borderColor: 'gray.300',
                        color: 'muted',
                      }}
                    />
                  </FormControl>
                  <PrimaryButton
                    variantColor="red"
                    display="flex"
                    ml="auto"
                    _hover={{
                      bg: 'rgb(227 60 60)',
                    }}
                    onClick={() => {
                      selectedFlip.ref.send('DELETE')
                      onCloseDeleteForm()
                    }}
                  >
                    Delete
                  </PrimaryButton>
                </>
              )}
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {global.isDev && (
          <Box position="absolute" left={6} bottom={6} zIndex="popover">
            <Debug>{current.value}</Debug>
          </Box>
        )}
      </Page>
    </Layout>
  )
}

// eslint-disable-next-line react/prop-types
function FlipCard({flipService, onDelete}) {
  const {t} = useTranslation()

  const [current, send] = useService(flipService)
  const {id, keywords, originalOrder, images, type, createdAt} = current.context

  const {colors} = useTheme()

  const isDraft = type === FlipType.Draft

  return (
    <Box position="relative">
      <FlipCardImageBox>
        {[FlipType.Publishing, FlipType.Invalid].includes(type) && (
          <FlipOverlay
            backgroundImage={
              // eslint-disable-next-line no-nested-ternary
              [FlipType.Publishing, FlipType.Deleting].some(x => x === type)
                ? `linear-gradient(to top, ${
                    colors.warning[500]
                  }, ${transparentize(100, colors.warning[500])})`
                : type === FlipType.Invalid
                ? `linear-gradient(to top, ${colors.red[500]}, ${transparentize(
                    100,
                    colors.red[500]
                  )})`
                : ''
            }
          >
            <FlipOverlayStatus>
              <FlipOverlayIcon name="info-solid" />
              <FlipOverlayText>
                {type === FlipType.Publishing && t('Mining...')}
                {type === FlipType.Deleting && t('Deleting...')}
                {type === FlipType.Invalid && t('Mining error')}
              </FlipOverlayText>
            </FlipOverlayStatus>
          </FlipOverlay>
        )}
        <FlipCardImage src={images[originalOrder ? originalOrder[0] : 0]} />
      </FlipCardImageBox>
      <Flex justifyContent="space-between" alignItems="flex-start" mt={4}>
        <Box>
          <FlipCardTitle>
            {keywords.words && keywords.words.length
              ? formatKeywords(keywords.words)
              : t('Missing keywords')}
          </FlipCardTitle>
          <FlipCardSubtitle>
            {dayjs(createdAt).format('d.MM.YYYY, H:mm')}
          </FlipCardSubtitle>
        </Box>
        <FlipCardMenu>
          {isDraft && (
            <>
              <FlipCardMenuItem onClick={() => send('PUBLISH', {id})}>
                <FlipCardMenuItemIcon name="upload" size={5} mr={2} />
                {t('Submit flip')}
              </FlipCardMenuItem>
              <FlipCardMenuItem>
                <NextLink href={`/flips/edit?id=${id}`}>
                  <Flex>
                    <FlipCardMenuItemIcon name="edit" size={5} mr={2} />
                    {t('Edit flip')}
                  </Flex>
                </NextLink>
              </FlipCardMenuItem>
              <MenuDivider color="rgb(232, 234, 237)" my={2} width="145px" />
            </>
          )}
          <FlipCardMenuItem onClick={onDelete}>
            <FlipCardMenuItemIcon
              name="delete"
              size={5}
              mr={2}
              color="red.500"
            />
            {t('Delete flip')}
          </FlipCardMenuItem>
        </FlipCardMenu>
      </Flex>
    </Box>
  )
}
